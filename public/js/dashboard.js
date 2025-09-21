// Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('📊 Dashboard initialized');
    
    // Initialize dashboard components
    initializeDashboard();
    initializeStatCards();
    initializeTooltips();
});

function initializeDashboard() {
    // Welcome animation
    const pageHeader = document.querySelector('.page-header');
    if (pageHeader) {
        pageHeader.style.opacity = '0';
        pageHeader.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            pageHeader.style.transition = 'all 0.6s ease';
            pageHeader.style.opacity = '1';
            pageHeader.style.transform = 'translateY(0)';
        }, 100);
    }
    
    // Stagger animate stat cards
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 200 + (index * 100));
    });
    
    // Animate main cards
    const mainCards = document.querySelectorAll('.card-custom');
    mainCards.forEach((card, index) => {
        if (!card.closest('.stat-card')) {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                card.style.transition = 'all 0.5s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 600 + (index * 150));
        }
    });
}

function initializeStatCards() {
    // Add click animations to stat cards
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach(card => {
        card.addEventListener('click', function() {
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
        
        // Add pulse animation for important stats
        const statValue = card.querySelector('h3');
        if (statValue && parseInt(statValue.textContent) > 0) {
            card.classList.add('has-data');
        }
    });
}

function initializeTooltips() {
    // Initialize Bootstrap tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function getTimeRemaining(dateString) {
    const now = new Date();
    const examDate = new Date(dateString);
    const timeDiff = examDate - now;
    
    if (timeDiff <= 0) return 'Past due';
    
    const days = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    
    if (days === 1) return 'Tomorrow';
    if (days < 7) return `${days} days`;
    if (days < 30) return `${Math.ceil(days / 7)} weeks`;
    return `${Math.ceil(days / 30)} months`;
}

// Real-time clock (optional)
function updateClock() {
    const clockElement = document.querySelector('.live-clock');
    if (clockElement) {
        const now = new Date();
        clockElement.textContent = now.toLocaleTimeString();
    }
}

// Update clock every second
setInterval(updateClock, 1000);

// Add some interactive features
document.addEventListener('click', function(e) {
    // Ripple effect for buttons
    if (e.target.classList.contains('btn') || e.target.closest('.btn')) {
        const button = e.target.classList.contains('btn') ? e.target : e.target.closest('.btn');
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(255,255,255,0.3);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s linear;
            pointer-events: none;
        `;
        
        // Add ripple keyframe if not exists
        if (!document.querySelector('#ripple-style')) {
            const style = document.createElement('style');
            style.id = 'ripple-style';
            style.textContent = `
                @keyframes ripple {
                    to {
                        transform: scale(4);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        button.style.position = 'relative';
        button.style.overflow = 'hidden';
        button.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
    }
});
