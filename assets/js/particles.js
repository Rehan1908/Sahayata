// Falling Particles Animation
// Creates a mesmerizing snow-like effect across all pages

class ParticlesSystem {
  constructor() {
    this.container = null;
    this.particles = [];
    this.maxParticles = 50;
    this.animationId = null;
    this.init();
  }

  init() {
    this.createContainer();
    this.createParticles();
    this.startAnimation();
  }

  createContainer() {
    // Remove existing container if it exists
    const existing = document.querySelector('.particles-container');
    if (existing) {
      existing.remove();
    }

    this.container = document.createElement('div');
    this.container.className = 'particles-container';
    document.body.appendChild(this.container);
  }

  createParticles() {
    for (let i = 0; i < this.maxParticles; i++) {
      this.createParticle();
    }
  }

  createParticle() {
    const particle = document.createElement('div');
    particle.className = 'particle';
    
    // Random size between 1px and 10px with weighted distribution (more small ones)
    const sizeRandom = Math.random();
    let size;
    if (sizeRandom < 0.5) {
      size = Math.random() * 3 + 1; // 1-4px (50% chance)
    } else if (sizeRandom < 0.8) {
      size = Math.random() * 3 + 4; // 4-7px (30% chance)
    } else {
      size = Math.random() * 3 + 7; // 7-10px (20% chance)
    }
    
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    
    // Random horizontal position
    particle.style.left = `${Math.random() * 100}%`;
    
    // Random animation duration between 8 and 25 seconds (slower for larger particles)
    const baseDuration = size > 6 ? 15 : size > 3 ? 12 : 8;
    const duration = Math.random() * 10 + baseDuration;
    particle.style.animationDuration = `${duration}s`;
    particle.style.setProperty('--fall-duration', `${duration}s`);
    
    // Random delay to stagger the particles
    const delay = Math.random() * duration;
    particle.style.animationDelay = `-${delay}s`;
    
    // Add floating animation to some particles (more likely for smaller particles)
    const floatChance = size < 4 ? 0.4 : size < 7 ? 0.3 : 0.2;
    if (Math.random() < floatChance) {
      particle.classList.add('floating');
      const floatDuration = Math.random() * 4 + 3;
      particle.style.setProperty('--float-duration', `${floatDuration}s`);
    }
    
    this.container.appendChild(particle);
    this.particles.push(particle);
  }

  startAnimation() {
    // The CSS animations handle the actual movement
    // This method can be used for future enhancements
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.container) {
      this.container.remove();
    }
    this.particles = [];
  }

  // Method to adjust particle density based on screen size
  adjustParticleCount() {
    const screenArea = window.innerWidth * window.innerHeight;
    const baseArea = 1920 * 1080; // Base screen size
    const ratio = screenArea / baseArea;
    
    // Adjust particle count (minimum 20, maximum 80)
    this.maxParticles = Math.max(20, Math.min(80, Math.floor(50 * ratio)));
    
    // Recreate particles if needed
    const currentCount = this.particles.length;
    if (currentCount !== this.maxParticles) {
      // Remove excess particles
      while (this.particles.length > this.maxParticles) {
        const particle = this.particles.pop();
        particle.remove();
      }
      
      // Add more particles if needed
      while (this.particles.length < this.maxParticles) {
        this.createParticle();
      }
    }
  }
}

// Initialize particles when DOM is loaded
let particlesSystem = null;

function initParticles() {
  if (!particlesSystem) {
    particlesSystem = new ParticlesSystem();
  }
}

// Initialize on DOM content loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initParticles);
} else {
  initParticles();
}

// Reinitialize on page navigation (for SPAs)
window.addEventListener('popstate', initParticles);

// Adjust particles on window resize with debouncing
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    if (particlesSystem) {
      particlesSystem.adjustParticleCount();
    }
  }, 250);
});

// Export for manual control if needed
window.ParticlesSystem = ParticlesSystem;
window.particlesSystem = particlesSystem;
