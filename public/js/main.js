// Lab Exam Portal - Main JavaScript File

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Lab Exam Portal initialized');
    
    // Initialize all components
    initPasswordToggle();
    initCaptcha();
    initFormValidation();
    initFormSubmission();
    initAnimations();
});

// Password Toggle Functionality
function initPasswordToggle() {
    const toggleBtn = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    
    if (toggleBtn && passwordInput) {
        toggleBtn.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            // Update button text
            this.innerHTML = type === 'password' 
                ? '<small class="text-muted">Show</small>' 
                : '<small class="text-muted">Hide</small>';
        });
    }
}

// CAPTCHA System
function initCaptcha() {
    const captchaCode = document.getElementById('captchaCode');
    const captchaInput = document.getElementById('captchaInput');
    const refreshBtn = document.getElementById('refreshCaptcha');
    
    if (captchaCode && captchaInput && refreshBtn) {
        let currentCaptcha = '';
        
        // Generate random CAPTCHA
        function generateCaptcha() {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let result = '';
            for (let i = 0; i < 5; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return result;
        }
        
        // Display CAPTCHA
        function displayCaptcha() {
            currentCaptcha = generateCaptcha();
            captchaCode.textContent = currentCaptcha;
            captchaInput.value = '';
            
            // Add some visual effects
            captchaCode.style.transform = 'scale(0.9)';
            setTimeout(() => {
                captchaCode.style.transform = 'scale(1)';
            }, 100);
        }
        
        // Validate CAPTCHA
        function validateCaptcha() {
            const userInput = captchaInput.value.toUpperCase();
            return userInput === currentCaptcha;
        }
        
        // Initialize first CAPTCHA
        displayCaptcha();
        
        // Refresh button
        refreshBtn.addEventListener('click', displayCaptcha);
        
        // Store validation function globally
        window.validateCaptcha = validateCaptcha;
        
        // Add visual feedback
        captchaInput.addEventListener('input', function() {
            const isValid = this.value.toUpperCase() === currentCaptcha;
            
            if (this.value.length === currentCaptcha.length) {
                if (isValid) {
                    this.classList.add('is-valid');
                    this.classList.remove('is-invalid');
                } else {
                    this.classList.add('is-invalid');
                    this.classList.remove('is-valid');
                }
            } else {
                this.classList.remove('is-valid', 'is-invalid');
            }
        });
    }
}

// Form Validation
function initFormValidation() {
    const forms = document.querySelectorAll('.needs-validation');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(event) {
            // Bootstrap validation
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            
            // CAPTCHA validation (only for login form)
            if (form.id === 'loginForm' && window.validateCaptcha) {
                if (!window.validateCaptcha()) {
                    event.preventDefault();
                    event.stopPropagation();
                    
                    // Show CAPTCHA error
                    const captchaInput = document.getElementById('captchaInput');
                    if (captchaInput) {
                        captchaInput.classList.add('is-invalid');
                        showAlert('Please enter the correct CAPTCHA', 'danger');
                    }
                }
            }
            
            form.classList.add('was-validated');
        });
        
        // Real-time validation
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', function() {
                if (this.checkValidity()) {
                    this.classList.add('is-valid');
                    this.classList.remove('is-invalid');
                } else {
                    this.classList.add('is-invalid');
                    this.classList.remove('is-valid');
                }
            });
            
            input.addEventListener('input', function() {
                if (this.classList.contains('was-validated')) {
                    if (this.checkValidity()) {
                        this.classList.add('is-valid');
                        this.classList.remove('is-invalid');
                    } else {
                        this.classList.add('is-invalid');
                        this.classList.remove('is-valid');
                    }
                }
            });
        });
    });
}

// Form Submission with Loading States
function initFormSubmission() {
    const loginForm = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');
    const loginSpinner = document.getElementById('loginSpinner');
    
    if (loginForm && loginBtn && loginSpinner) {
        loginForm.addEventListener('submit', function(e) {
            if (loginForm.checkValidity() && (!window.validateCaptcha || window.validateCaptcha())) {
                // Show loading state
                loginBtn.disabled = true;
                loginSpinner.classList.remove('d-none');
                
                // Change button text
                const originalText = loginBtn.innerHTML;
                loginBtn.innerHTML = `
                    <span class="spinner-border spinner-border-sm me-2"></span>
                    Logging in...
                `;
                
                // If form submission fails, restore button
                setTimeout(() => {
                    if (loginBtn.disabled) {
                        loginBtn.disabled = false;
                        loginSpinner.classList.add('d-none');
                        loginBtn.innerHTML = originalText;
                    }
                }, 10000); // 10 second timeout
            }
        });
    }
    
    // Signup form
    const signupForm = document.querySelector('form[action="/auth/signup"]');
    if (signupForm) {
        signupForm.addEventListener('submit', function(e) {
            if (signupForm.checkValidity()) {
                const submitBtn = signupForm.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = `
                        <span class="spinner-border spinner-border-sm me-2"></span>
                        Creating Account...
                    `;
                }
            }
        });
    }
}

// Animations and Visual Effects
function initAnimations() {
    // Smooth scroll for any anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Add hover effects to form inputs
    const formInputs = document.querySelectorAll('.form-control, .form-select');
    formInputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.closest('.form-floating')?.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            this.closest('.form-floating')?.classList.remove('focused');
        });
    });
    
    // Auto-dismiss alerts after 5 seconds
    const alerts = document.querySelectorAll('.alert:not(.alert-permanent)');
    alerts.forEach(alert => {
        setTimeout(() => {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }, 5000);
    });
}

// Utility Functions
function showAlert(message, type = 'info', duration = 5000) {
    const alertContainer = document.createElement('div');
    alertContainer.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertContainer.style.cssText = `
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
        box-shadow: 0 8px 25px rgba(0,0,0,0.15);
    `;
    
    alertContainer.innerHTML = `
        <i class="bi bi-${getAlertIcon(type)} me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertContainer);
    
    // Auto remove
    setTimeout(() => {
        const bsAlert = new bootstrap.Alert(alertContainer);
        bsAlert.close();
    }, duration);
}

function getAlertIcon(type) {
    const icons = {
        'success': 'check-circle',
        'danger': 'exclamation-triangle',
        'warning': 'exclamation-triangle',
        'info': 'info-circle',
        'primary': 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// Role-based welcome messages
function showRoleWelcome(role) {
    const messages = {
        'Student': '🎓 Welcome to your Student Portal!',
        'Faculty': '👩‍🏫 Welcome to your Faculty Dashboard!',
        'Admin': '⚙️ Welcome to the Admin Panel!'
    };
    
    if (messages[role]) {
        showAlert(messages[role], 'success', 3000);
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Alt + L to focus on login form
    if (e.altKey && e.key === 'l') {
        const usernameInput = document.getElementById('username');
        if (usernameInput) {
            e.preventDefault();
            usernameInput.focus();
        }
    }
    
    // Enter key on CAPTCHA input to submit form
    if (e.key === 'Enter' && e.target.id === 'captchaInput') {
        const form = e.target.closest('form');
        if (form && window.validateCaptcha && window.validateCaptcha()) {
            form.submit();
        }
    }
});

// Handle connection issues
window.addEventListener('online', function() {
    showAlert('🌐 Connection restored!', 'success', 2000);
});

window.addEventListener('offline', function() {
    showAlert('⚠️ No internet connection', 'warning', 5000);
});

// Performance monitoring
if ('performance' in window) {
    window.addEventListener('load', function() {
        const loadTime = performance.now();
        if (loadTime > 3000) {
            console.warn('⚠️ Slow page load detected:', Math.round(loadTime), 'ms');
        } else {
            console.log('✅ Page loaded in:', Math.round(loadTime), 'ms');
        }
    });
}

// Console easter egg
console.log(`
🧪 Lab Exam Portal v1.0
━━━━━━━━━━━━━━━━━━━━━━━━━
Built with ❤️ using:
• Node.js + Express
• MongoDB Atlas  
• Bootstrap 5
• EJS Templates

For support: contact your administrator
`);
