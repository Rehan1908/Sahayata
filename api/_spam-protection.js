// Comprehensive spam protection and rate limiting
const rateLimit = new Map();
const duplicateCheck = new Map();
const sessionLimits = new Map();

// Rate limiting configurations
const RATE_LIMITS = {
  samvad: { maxRequests: 5, windowMs: 5 * 60 * 1000 }, // 5 posts per 5 minutes
  journeys: { maxRequests: 3, windowMs: 60 * 60 * 1000 }, // 3 journeys per hour
  notes: { maxRequests: 10, windowMs: 60 * 1000 }, // 10 notes per minute
  professionals: { maxRequests: 2, windowMs: 60 * 60 * 1000 }, // 2 searches per hour
  default: { maxRequests: 20, windowMs: 60 * 1000 } // 20 requests per minute default
};

function getClientId(req) {
  return req.headers['x-forwarded-for'] || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress ||
         'unknown';
}

function checkRateLimit(clientId, endpoint = 'default') {
  const config = RATE_LIMITS[endpoint] || RATE_LIMITS.default;
  const now = Date.now();
  const key = `${clientId}:${endpoint}`;
  
  if (!rateLimit.has(key)) {
    rateLimit.set(key, { count: 1, resetTime: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1 };
  }
  
  const limit = rateLimit.get(key);
  
  if (now > limit.resetTime) {
    // Reset window
    rateLimit.set(key, { count: 1, resetTime: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1 };
  }
  
  if (limit.count >= config.maxRequests) {
    return { 
      allowed: false, 
      remaining: 0, 
      resetTime: limit.resetTime,
      error: `Rate limit exceeded. Max ${config.maxRequests} requests per ${Math.round(config.windowMs/1000/60)} minutes.`
    };
  }
  
  limit.count++;
  return { allowed: true, remaining: config.maxRequests - limit.count };
}

function validateContent(text, minLength = 3, maxLength = 2000) {
  if (!text || typeof text !== 'string') {
    return { valid: false, error: 'Content is required' };
  }
  
  const trimmed = text.trim();
  if (trimmed.length < minLength) {
    return { valid: false, error: `Content must be at least ${minLength} characters` };
  }
  
  if (trimmed.length > maxLength) {
    return { valid: false, error: `Content must be less than ${maxLength} characters` };
  }
  
  // Check for spam patterns
  const spamPatterns = [
    /(.)\1{10,}/, // Repeated characters
    /^[A-Z\s!]{20,}$/, // All caps
    /(?:https?:\/\/|www\.)[^\s]{10,}/gi, // URLs
    /[\u0080-\uFFFF]/, // Non-ASCII characters (potential spam)
  ];
  
  for (const pattern of spamPatterns) {
    if (pattern.test(trimmed)) {
      return { valid: false, error: 'Content appears to be spam' };
    }
  }
  
  return { valid: true, content: trimmed };
}

function checkDuplicateContent(clientId, content, endpoint, timeWindow = 60000) {
  const key = `${clientId}:${endpoint}`;
  const now = Date.now();
  const contentHash = hashString(content);
  
  if (!duplicateCheck.has(key)) {
    duplicateCheck.set(key, []);
  }
  
  const history = duplicateCheck.get(key);
  
  // Clean old entries
  const validEntries = history.filter(entry => now - entry.timestamp < timeWindow);
  
  // Check for duplicate
  const isDuplicate = validEntries.some(entry => entry.hash === contentHash);
  
  if (isDuplicate) {
    return { isDuplicate: true, error: 'Duplicate content detected. Please wait before posting similar content.' };
  }
  
  // Add new entry
  validEntries.push({ hash: contentHash, timestamp: now });
  duplicateCheck.set(key, validEntries);
  
  return { isDuplicate: false };
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString();
}

function sessionLimitCheck(sessionId, endpoint, maxPerSession = 50) {
  const key = `${sessionId}:${endpoint}`;
  const count = sessionLimits.get(key) || 0;
  
  if (count >= maxPerSession) {
    return { 
      allowed: false, 
      error: `Session limit exceeded. Maximum ${maxPerSession} ${endpoint} per session.`
    };
  }
  
  sessionLimits.set(key, count + 1);
  return { allowed: true, count: count + 1 };
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  
  // Clean rate limits
  for (const [key, value] of rateLimit.entries()) {
    if (now > value.resetTime) {
      rateLimit.delete(key);
    }
  }
  
  // Clean duplicate checks
  for (const [key, history] of duplicateCheck.entries()) {
    const validEntries = history.filter(entry => now - entry.timestamp < 300000); // 5 minutes
    if (validEntries.length === 0) {
      duplicateCheck.delete(key);
    } else {
      duplicateCheck.set(key, validEntries);
    }
  }
}, 60000); // Clean every minute

module.exports = {
  getClientId,
  checkRateLimit,
  validateContent,
  checkDuplicateContent,
  sessionLimitCheck,
  RATE_LIMITS
};
