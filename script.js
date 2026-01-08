/**
 * WABridge - WhatsApp Business Services
 * Main JavaScript File
 */

document.addEventListener('DOMContentLoaded', function () {
  initNavigation();
  initSmoothScroll();
  initFadeInOnScroll();
  initFormValidation();
  initHeaderScroll();
  checkForAuthCode();
});

// Check for WhatsApp Signup OAuth Code
function checkForAuthCode() {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');

  if (code) {
    // We are in the popup after Facebook redirect
    console.log('Authorization code found:', code);

    // Show a processing overlay
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
    overlay.style.zIndex = '9999';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.innerHTML = `
      <div style="border: 4px solid #f3f3f3; border-top: 4px solid #25D366; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite;"></div>
      <h3 style="margin-top: 20px; color: #333;">Connecting WhatsApp Account...</h3>
      <p style="color: #666;">Please wait while we finalize the setup.</p>
    `;
    document.body.appendChild(overlay);

    // Add keyframes for spinner
    const style = document.createElement('style');
    style.innerHTML = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
    document.head.appendChild(style);

    // Call Backend
    const CONFIG = {
      TOKEN_EXCHANGE_URL: '/api/exchange-token'
    };

    // We must use the exact same redirect_uri strictly
    const redirectUri = 'https://wabridge.vercel.app/';

    fetch(CONFIG.TOKEN_EXCHANGE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code: code,
        redirect_uri: redirectUri
      })
    })
      .then(response => response.json())
      .then(data => {
        if (data.error) throw new Error(data.error);

        // Success! Send data to parent
        if (window.opener) {
          window.opener.postMessage({
            accessToken: data.access_token,
            whatsappBusinessAccountId: data.whatsapp_business_account_id,
            phoneNumbers: data.phone_numbers
          }, '*');

          overlay.innerHTML = `
                <h3 style="color: #25D366;">Success!</h3>
                <p>Account connected. Closing window...</p>
            `;

          setTimeout(() => window.close(), 1500);
        } else {
          overlay.innerHTML = '<h3 style="color: #333;">Connected!</h3><p>You can close this window now.</p>';
        }
      })
      .catch(error => {
        console.error('Exchange error:', error);
        overlay.innerHTML = `
            <h3 style="color: #dc3545;">Connection Failed</h3>
            <p>${error.message || 'Unknown error occurred'}</p>
            <button onclick="window.close()" style="margin-top: 15px; padding: 10px 20px; background: #333; color: #fff; border: none; border-radius: 5px; cursor: pointer;">Close</button>
        `;
      });
  }
}

// Navigation Toggle (Mobile)
function initNavigation() {
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('.nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', function () {
      navToggle.classList.toggle('active');
      navMenu.classList.toggle('active');
      document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
    });

    navLinks.forEach(link => {
      link.addEventListener('click', function () {
        navToggle.classList.remove('active');
        navMenu.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }
}

// Smooth Scroll
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const offset = 80;
        window.scrollTo({
          top: target.getBoundingClientRect().top + window.pageYOffset - offset,
          behavior: 'smooth'
        });
      }
    });
  });
}

// Fade In On Scroll
function initFadeInOnScroll() {
  const elements = document.querySelectorAll('.fade-in-up');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    elements.forEach(el => observer.observe(el));
  } else {
    elements.forEach(el => el.classList.add('visible'));
  }
}

// Header Scroll Effect
function initHeaderScroll() {
  const header = document.querySelector('.header');
  if (header) {
    window.addEventListener('scroll', function () {
      header.classList.toggle('scrolled', window.pageYOffset > 50);
    });
  }
}

// Form Validation
function initFormValidation() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const formStatus = document.getElementById('formStatus');
  const submitBtn = form.querySelector('button[type="submit"]');

  const validators = {
    name: { validate: v => v.trim().length >= 2, message: 'Enter your name (min 2 chars)' },
    email: { validate: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), message: 'Enter a valid email' },
    phone: { validate: v => /^[+]?[\d\s-]{10,}$/.test(v.replace(/\s/g, '')), message: 'Enter valid phone (min 10 digits)' },
    message: { validate: v => v.trim().length >= 10, message: 'Enter message (min 10 chars)' }
  };

  Object.keys(validators).forEach(name => {
    const field = form.querySelector(`[name="${name}"]`);
    if (field) {
      field.addEventListener('blur', () => validateField(field, validators[name]));
      field.addEventListener('input', () => clearError(field));
    }
  });

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    let valid = true;
    Object.keys(validators).forEach(name => {
      const field = form.querySelector(`[name="${name}"]`);
      if (field && !validateField(field, validators[name])) valid = false;
    });

    if (!valid) { showStatus('Please fix errors above.', 'error'); return; }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    try {
      await new Promise(r => setTimeout(r, 1500)); // Simulate API
      showStatus('Thank you! We\'ll contact you soon.', 'success');
      form.reset();
    } catch (err) {
      showStatus('Error. Please try WhatsApp.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Message';
    }
  });

  function validateField(field, validator) {
    const group = field.closest('.form-group');
    if (!validator.validate(field.value)) {
      group.classList.add('has-error');
      field.classList.add('error');
      let errEl = group.querySelector('.error-message');
      if (!errEl) { errEl = document.createElement('span'); errEl.className = 'error-message'; group.appendChild(errEl); }
      errEl.textContent = validator.message;
      return false;
    }
    clearError(field);
    return true;
  }

  function clearError(field) {
    const group = field.closest('.form-group');
    group.classList.remove('has-error');
    field.classList.remove('error');
  }

  function showStatus(msg, type) {
    if (formStatus) {
      formStatus.textContent = msg;
      formStatus.className = 'form-status ' + type;
      if (type === 'success') setTimeout(() => formStatus.className = 'form-status', 5000);
    }
  }
}

// WhatsApp Chat
function openWhatsAppChat() {
  const phone = '919876543210'; // Replace with actual number
  const msg = encodeURIComponent('Hi! I\'m interested in WABridge WhatsApp Business services.');
  window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
}

function selectPlan(plan) {
  const msg = encodeURIComponent(`Hi! I'm interested in the ${plan} plan.`);
  window.open(`https://wa.me/919876543210?text=${msg}`, '_blank');
}
