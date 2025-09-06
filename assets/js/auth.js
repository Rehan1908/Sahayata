// Authentication JavaScript
(function() {
  'use strict';

  // Safe notification function - fallback if main.js isn't loaded yet
  function safeNotification(message, type = 'info') {
    if (typeof showNotification === 'function') {
      showNotification(message, type);
    } else {
      // Fallback - simple alert or console log
      console.log(`[${type.toUpperCase()}] ${message}`);
      if (type === 'error') {
        alert(message);
      }
    }
  }

  // Safe API request function - fallback if main.js isn't loaded yet
  async function safeAPIRequest(url, options = {}) {
    if (typeof makeAPIRequest === 'function') {
      return await makeAPIRequest(url, options);
    } else {
      // Fallback implementation
      try {
        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            ...options.headers
          },
          ...options
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('API Request failed:', error);
        throw error;
      }
    }
  }

  // Authentication state management
  const auth = {
    isLoggedIn: false,
    user: null,
    
    init() {
      this.checkAuthState();
      this.setupEventListeners();
      this.setupAuthForms();
    },
    
    checkAuthState() {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      if (token && userData) {
        try {
          this.user = JSON.parse(userData);
          this.isLoggedIn = true;
          this.updateUI();
        } catch (e) {
          console.error('Error parsing user data:', e);
          this.logout();
        }
      }
    },
    
    updateUI() {
      const authButtons = document.querySelectorAll('.auth-required');
      const userMenu = document.querySelector('.user-menu');
      const authLink = document.getElementById('auth-link');
      const userNameSpan = document.querySelector('.user-name');
      
      if (this.isLoggedIn && this.user) {
        // Hide auth link, show user menu
        if (authLink) authLink.classList.add('hidden');
        if (userMenu) userMenu.classList.add('active');
        if (userNameSpan) userNameSpan.textContent = `Welcome, ${this.user.name}`;
        
        // Enable auth-required buttons
        authButtons.forEach(btn => {
          btn.style.display = 'block';
          btn.textContent = btn.textContent.replace('(Login Required)', '');
        });
      } else {
        // Show auth link, hide user menu
        if (authLink) authLink.classList.remove('hidden');
        if (userMenu) userMenu.classList.remove('active');
        
        // Disable auth-required buttons
        authButtons.forEach(btn => {
          btn.style.display = 'none';
        });
      }
      
      // Trigger auth state change event
      window.dispatchEvent(new CustomEvent('authStateChanged', { 
        detail: { isLoggedIn: this.isLoggedIn, user: this.user } 
      }));
    },
    
    async login(email, password) {
      try {
        const response = await safeAPIRequest('/api/auth', {
          method: 'POST',
          body: JSON.stringify({ 
            action: 'login',
            email, 
            password 
          })
        });
        
        if (response.ok) {
          this.user = response.user;
          this.isLoggedIn = true;
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.user));
          this.updateUI();
          
          // Redirect to intended page or home
          const urlParams = new URLSearchParams(window.location.search);
          const returnUrl = urlParams.get('return');
          
          if (returnUrl) {
            // Decode the return URL and redirect
            window.location.href = decodeURIComponent(returnUrl);
          } else {
            // Default redirect to home
            window.location.href = '../index.html';
          }
          
          return { success: true };
        } else {
          return { success: false, error: response.error || 'Login failed' };
        }
      } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: error.message };
      }
    },
    
    async register(name, email, password) {
      try {
        const response = await safeAPIRequest('/api/auth', {
          method: 'POST',
          body: JSON.stringify({ 
            action: 'register',
            name, 
            email, 
            password 
          })
        });
        
        if (response.ok) {
          safeNotification('Account created successfully! Please sign in.', 'success');
          // Switch to login tab
          document.querySelector('[data-tab="login"]').click();
          return { success: true };
        } else {
          return { success: false, error: response.error || 'Registration failed' };
        }
      } catch (error) {
        console.error('Registration error:', error);
        return { success: false, error: error.message };
      }
    },
    
    logout() {
      this.isLoggedIn = false;
      this.user = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '../index.html';
    },
    
    requireAuth(action) {
      if (!this.isLoggedIn) {
        safeNotification('Please sign in to ' + action, 'info');
        const currentUrl = encodeURIComponent(window.location.pathname + window.location.search);
        
        // Determine the correct path to auth.html based on current location
        const authPath = window.location.pathname.includes('/pages/') 
          ? './auth.html' 
          : './pages/auth.html';
          
        window.location.href = `${authPath}?return=${currentUrl}`;
        return false;
      }
      return true;
    },
    
    setupEventListeners() {
      // Check for auth requirement on creation buttons
      document.addEventListener('click', (e) => {
        const button = e.target.closest('[data-auth-required]');
        if (button && !this.isLoggedIn) {
          e.preventDefault();
          const action = button.dataset.authRequired || 'continue';
          this.requireAuth(action);
        }
      });
      
      // Setup logout buttons
      document.addEventListener('click', (e) => {
        if (e.target.closest('.logout-btn')) {
          e.preventDefault();
          this.logout();
        }
      });
    },
    
    setupAuthForms() {
      if (!document.getElementById('login-form')) return;
      
      // Tab switching
      const tabs = document.querySelectorAll('.auth-tab');
      const forms = document.querySelectorAll('.auth-form');
      
      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          const target = tab.dataset.tab;
          
          // Update tab states
          tabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          
          // Show corresponding form
          forms.forEach(form => {
            form.style.display = form.id === `${target}-form` ? 'block' : 'none';
          });
        });
      });
      
      // Forgot password functionality
      const forgotBtn = document.getElementById('forgot-password');
      const backToLoginBtn = document.getElementById('back-to-login');
      const forgotForm = document.getElementById('forgot-password-form');
      const loginForm = document.getElementById('login-form');
      
      if (forgotBtn) {
        forgotBtn.addEventListener('click', () => {
          loginForm.style.display = 'none';
          forgotForm.style.display = 'block';
          // Update tabs
          tabs.forEach(t => t.classList.remove('active'));
        });
      }
      
      if (backToLoginBtn) {
        backToLoginBtn.addEventListener('click', () => {
          forgotForm.style.display = 'none';
          loginForm.style.display = 'block';
          // Activate login tab
          const loginTab = document.querySelector('[data-tab="login"]');
          if (loginTab) {
            tabs.forEach(t => t.classList.remove('active'));
            loginTab.classList.add('active');
          }
        });
      }
      
      // Login form
      if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const email = document.getElementById('login-email').value;
          const password = document.getElementById('login-password').value;
          const messageEl = document.getElementById('login-message');
          const submitBtn = loginForm.querySelector('button[type="submit"]');
          
          submitBtn.disabled = true;
          submitBtn.textContent = 'Signing in...';
          
          const result = await this.login(email, password);
          
          if (result.success) {
            messageEl.className = 'message success';
            messageEl.textContent = 'Sign in successful! Redirecting...';
          } else {
            messageEl.className = 'message error';
            messageEl.textContent = result.error;
            submitBtn.disabled = false;
            submitBtn.textContent = 'Sign In';
          }
        });
      }
      
      // Registration form
      const registerForm = document.getElementById('register-form');
      if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const name = document.getElementById('register-name').value;
          const email = document.getElementById('register-email').value;
          const password = document.getElementById('register-password').value;
          const confirmPassword = document.getElementById('register-confirm').value;
          const messageEl = document.getElementById('register-message');
          const submitBtn = registerForm.querySelector('button[type="submit"]');
          
          // Validate passwords match
          if (password !== confirmPassword) {
            messageEl.className = 'message error';
            messageEl.textContent = 'Passwords do not match';
            return;
          }
          
          submitBtn.disabled = true;
          submitBtn.textContent = 'Creating account...';
          
          const result = await this.register(name, email, password);
          
          if (result.success) {
            messageEl.className = 'message success';
            messageEl.textContent = 'Account created successfully!';
            registerForm.reset();
          } else {
            messageEl.className = 'message error';
            messageEl.textContent = result.error;
            submitBtn.disabled = false;
            submitBtn.textContent = 'Create Account';
          }
        });
      }
      
      // Forgot password form
      if (forgotForm) {
        forgotForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const email = document.getElementById('forgot-email').value;
          const messageEl = document.getElementById('forgot-message');
          const submitBtn = forgotForm.querySelector('button[type="submit"]');
          
          submitBtn.disabled = true;
          submitBtn.textContent = 'Sending...';
          
          try {
            const response = await safeAPIRequest('/api/auth', {
              method: 'POST',
              body: JSON.stringify({
                action: 'forgot-password',
                email
              })
            });
            
            if (response.ok) {
              messageEl.className = 'message success';
              messageEl.textContent = 'If an account exists with this email, you will receive a password reset link.';
              forgotForm.reset();
            } else {
              messageEl.className = 'message error';
              messageEl.textContent = response.error || 'Failed to send reset email';
            }
          } catch (error) {
            messageEl.className = 'message error';
            messageEl.textContent = 'Network error. Please try again.';
          }
          
          submitBtn.disabled = false;
          submitBtn.textContent = 'Send Reset Link';
        });
      }
    }
  };
  
  // Initialize auth system
  document.addEventListener('DOMContentLoaded', () => {
    auth.init();
  });
  
  // Export auth object for global use
  window.sahayataAuth = auth;
  
})();
