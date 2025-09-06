// Global error handling and notification system
window.addEventListener('error', function(e) {
  console.error('Global error:', e.error);
  showNotification('An unexpected error occurred. Please refresh the page.', 'error');
});

window.addEventListener('unhandledrejection', function(e) {
  console.error('Unhandled promise rejection:', e.reason);
  showNotification('Connection error. Please check your internet connection.', 'error');
});

// Notification system
function showNotification(message, type = 'info', duration = 5000) {
  // Remove existing notifications
  const existing = document.querySelector('.notification');
  if (existing) existing.remove();
  
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  // Add to page
  document.body.appendChild(notification);
  
  // Auto remove
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, duration);
  
  // Click to dismiss
  notification.addEventListener('click', () => notification.remove());
}

// Enhanced API request with error handling
async function makeAPIRequest(url, options = {}) {
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
    console.error('API request failed:', error);
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error. Please check your connection.');
    }
    throw error;
  }
}

// Rate limiting tracker for client-side
const rateLimitTracker = {
  limits: new Map(),
  
  checkLimit(endpoint, maxRequests = 5, windowMs = 60000) {
    const now = Date.now();
    const key = endpoint;
    
    if (!this.limits.has(key)) {
      this.limits.set(key, { count: 1, resetTime: now + windowMs });
      return { allowed: true, remaining: maxRequests - 1 };
    }
    
    const limit = this.limits.get(key);
    
    if (now > limit.resetTime) {
      this.limits.set(key, { count: 1, resetTime: now + windowMs });
      return { allowed: true, remaining: maxRequests - 1 };
    }
    
    if (limit.count >= maxRequests) {
      return { 
        allowed: false, 
        error: `Please wait ${Math.ceil((limit.resetTime - now) / 1000)} seconds before trying again.`
      };
    }
    
    limit.count++;
    return { allowed: true, remaining: maxRequests - limit.count };
  }
};

// Basic interactivity with error handling
(function(){
  const yearEl = document.getElementById('year');
  if(yearEl) yearEl.textContent = new Date().getFullYear();
  // Inject floating emergency button on pages without one in view
  try{
    const hasNavCta = !!document.querySelector('.primary-nav .nav-cta');
    const hasHeroCta = !!document.querySelector('.cta .btn.btn-danger');
    const existingFloat = !!document.querySelector('.float-emergency');
    if(!hasNavCta && !hasHeroCta && !existingFloat){
      const div = document.createElement('div');
      div.className = 'float-emergency';
      div.innerHTML = '<a class="btn btn-danger" href="tel:18005990019" aria-label="Aapatkal – Call Tele MANAS 24 by 7">Aapatkal</a>';
      document.body.appendChild(div);
    }
  }catch{ /* no-op */ }

  const groundingBtn = document.getElementById('grounding-btn');
  const overlay = document.getElementById('grounding-overlay');
  const closeBtn = document.getElementById('grounding-close');
  const ball = document.getElementById('breath-ball');
  const instruction = document.getElementById('grounding-instruction');
  let animTimer = null;

  if(groundingBtn){ groundingBtn.addEventListener('click', openGrounding); }
  if(closeBtn){ closeBtn.addEventListener('click', closeGrounding); }
  if(overlay){ overlay.addEventListener('click', (e)=>{ if(e.target === overlay) closeGrounding(); }); }

  function openGrounding(){
    if(!overlay){ return legacyRunOnButton(); }
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    // Reset circle animation so it always restarts cleanly
    if(ball){
      ball.style.animation = 'none';
      ball.style.transform = 'scale(1)';
      // force reflow to allow reapplying animations
      void ball.offsetWidth;
    }
    runBreathingSequence();
  }

  function closeGrounding(){
    if(animTimer){ clearTimeout(animTimer); animTimer = null; }
    if(overlay){ overlay.style.display = 'none'; }
    document.body.style.overflow = '';
    if(ball){ ball.style.transform = 'scale(1)'; }
  }

  // Fallback to old inline text sequence on the button if overlay missing
  function legacyRunOnButton(){
    const steps = [
      'Inhale gently… 4 counts',
      'Hold… 4 counts',
      'Exhale slowly… 6 counts',
      'Notice: 3 things you see',
      'Notice: 2 things you feel',
      'Notice: 1 thing you hear',
      'You are safe. You are not alone.'
    ];
    let i = 0; const btn = groundingBtn; const orig = btn.textContent; btn.disabled = true;
    const interval = setInterval(()=>{
      btn.textContent = steps[i++];
      if(i >= steps.length){
        clearInterval(interval);
        setTimeout(()=>{ btn.disabled = false; btn.textContent = orig; }, 1200);
      }
    }, 1600);
  }

  // New breathing overlay sequence
  function runBreathingSequence(){
    // Durations (ms)
    const inhale = 4000; // 4s
    const hold = 4000;   // 4s
    const exhale = 6000; // 6s
    const pause = 800;   // small rest between instructions

    let cycle = 0;
    const maxCycles = 1; // one cycle then grounding prompts

    function stepInhale(){
      if(instruction) instruction.textContent = 'Inhale gently… 4';
      if(ball){
        ball.style.animation = `breath-in ${inhale}ms ease-in forwards`;
      }
      animTimer = setTimeout(stepHold, inhale + pause);
    }
    function stepHold(){
      if(instruction) instruction.textContent = 'Hold… 4';
      animTimer = setTimeout(stepExhale, hold + pause);
    }
    function stepExhale(){
      if(instruction) instruction.textContent = 'Exhale slowly… 6';
      if(ball){
        ball.style.animation = `breath-out ${exhale}ms ease-out forwards`;
      }
      animTimer = setTimeout(()=>{
        cycle++;
        if(cycle >= maxCycles){
          showGroundingPrompts();
        }else{
          stepInhale();
        }
      }, exhale + pause);
    }
    stepInhale();
  }

  function showGroundingPrompts(){
    const prompts = [
      'Notice: 3 things you can see',
      'Notice: 2 things you can feel',
      'Notice: 1 thing you can hear',
      'You are safe. You are not alone.'
    ];
    let i = 0;
    function next(){
      if(!instruction) return;
      instruction.textContent = prompts[i++];
      if(i < prompts.length){ animTimer = setTimeout(next, 1800); }
      else { animTimer = setTimeout(closeGrounding, 2000); }
    }
    next();
  }
})();

// (Removed) Anonymous check-in demo was deleted from the homepage to keep it focused.

// Update user menu display
function updateUserMenu() {
  const userMenu = document.querySelector('.user-menu');
  const authLink = document.getElementById('auth-link');
  const userNameSpan = document.querySelector('.user-name');
  
  if (!userMenu || !authLink) return;
  
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const token = localStorage.getItem('token');
  
  if (user && token) {
    // User is logged in
    userMenu.classList.add('active');
    authLink.classList.add('hidden');
    if (userNameSpan) {
      userNameSpan.textContent = `Welcome, ${user.name}`;
    }
  } else {
    // User is not logged in
    userMenu.classList.remove('active');
    authLink.classList.remove('hidden');
  }
}

// Handle logout
function handleLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  updateUserMenu();
  showNotification('Logged out successfully', 'success');
  
  // Redirect to home if on auth-required page
  if (window.location.pathname.includes('auth.html')) {
    window.location.href = '../index.html';
  }
}

// Initialize user menu when DOM loads
document.addEventListener('DOMContentLoaded', function() {
  // Ensure auth system is available before updating UI
  setTimeout(() => {
    if (window.sahayataAuth) {
      window.sahayataAuth.updateUI();
    } else {
      updateUserMenu();
    }
  }, 100);
  
  // Add logout handler
  const logoutBtn = document.querySelector('.logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
      e.preventDefault();
      if (window.sahayataAuth) {
        window.sahayataAuth.logout();
      } else {
        handleLogout();
      }
    });
  }
});

// Update user menu when auth state changes
window.addEventListener('storage', function(e) {
  if (e.key === 'token' || e.key === 'user') {
    updateUserMenu();
  }
});
