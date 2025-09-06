const { getDb } = require('./_db.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Simple rate limiting for auth
const authAttempts = new Map();

function checkAuthRateLimit(ip) {
  const now = Date.now();
  const attempts = authAttempts.get(ip) || { count: 0, resetTime: now + 15 * 60 * 1000 };
  
  if (now > attempts.resetTime) {
    authAttempts.set(ip, { count: 1, resetTime: now + 15 * 60 * 1000 });
    return { allowed: true, remaining: 4 };
  }
  
  if (attempts.count >= 5) {
    return { 
      allowed: false, 
      error: 'Too many authentication attempts. Please try again in 15 minutes.'
    };
  }
  
  attempts.count++;
  authAttempts.set(ip, attempts);
  return { allowed: true, remaining: 5 - attempts.count };
}

module.exports = async function handler(req, res) {
  const clientIp = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';
  
  try {
    const db = await getDb();
    const users = db.collection('users');
    
    if (req.method === 'POST') {
      // Rate limiting
      const rateCheck = checkAuthRateLimit(clientIp);
      if (!rateCheck.allowed) {
        return res.status(429).json({ ok: false, error: rateCheck.error });
      }
      
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const { action, email, password, name } = body;
      
      if (!email || !password) {
        return res.status(400).json({ ok: false, error: 'Email and password are required' });
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ ok: false, error: 'Invalid email format' });
      }
      
      if (action === 'register') {
        // Registration
        if (!name || name.trim().length < 2) {
          return res.status(400).json({ ok: false, error: 'Name must be at least 2 characters' });
        }
        
        if (password.length < 8) {
          return res.status(400).json({ ok: false, error: 'Password must be at least 8 characters' });
        }
        
        // Check if user already exists
        const existingUser = await users.findOne({ email: email.toLowerCase() });
        if (existingUser) {
          return res.status(409).json({ ok: false, error: 'An account with this email already exists' });
        }
        
        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        // Create user
        const newUser = {
          name: name.trim(),
          email: email.toLowerCase(),
          password: hashedPassword,
          createdAt: new Date().toISOString(),
          lastLogin: null,
          verified: false,
          settings: {
            notifications: true,
            privacy: 'private'
          }
        };
        
        const result = await users.insertOne(newUser);
        
        return res.status(200).json({ 
          ok: true, 
          message: 'Account created successfully',
          userId: result.insertedId
        });
        
      } else if (action === 'forgot-password') {
        // Forgot password - Always return success for security
        const user = await users.findOne({ email: email.toLowerCase() });
        
        if (user) {
          // Generate reset token (in a real app, this would be sent via email)
          const resetToken = jwt.sign(
            { userId: user._id, email: user.email, purpose: 'password-reset' },
            process.env.JWT_SECRET || 'sahayata-secret-key',
            { expiresIn: '1h' }
          );
          
          // In a real application, you would:
          // 1. Save the reset token to the database with expiration
          // 2. Send an email with the reset link
          // For now, we'll just log it
          console.log(`Password reset token for ${email}: ${resetToken}`);
        }
        
        // Always return success message for security (don't reveal if email exists)
        return res.status(200).json({ 
          ok: true, 
          message: 'If an account exists with this email, you will receive a password reset link.'
        });
        
      } else {
        // Login
        const user = await users.findOne({ email: email.toLowerCase() });
        if (!user) {
          return res.status(401).json({ ok: false, error: 'Invalid email or password' });
        }
        
        // Check password
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
          return res.status(401).json({ ok: false, error: 'Invalid email or password' });
        }
        
        // Update last login
        await users.updateOne(
          { _id: user._id },
          { $set: { lastLogin: new Date().toISOString() } }
        );
        
        // Generate JWT token
        const token = jwt.sign(
          { 
            userId: user._id, 
            email: user.email,
            name: user.name 
          },
          process.env.JWT_SECRET || 'sahayata-secret-key',
          { expiresIn: '7d' }
        );
        
        return res.status(200).json({
          ok: true,
          token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            settings: user.settings
          }
        });
      }
    }
    
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
    
  } catch (error) {
    console.error('Auth API error:', error);
    return res.status(500).json({ ok: false, error: 'Internal server error' });
  }
};
