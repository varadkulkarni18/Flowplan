// Theme Management
class ThemeManager {
    constructor() {
        this.theme = localStorage.getItem('theme') || 'light';
        this.init();
    }

    init() {
        this.applyTheme();
        this.bindEvents();
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
        localStorage.setItem('theme', this.theme);
    }

    toggle() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        this.applyTheme();
    }

    bindEvents() {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggle());
        }
    }
}

// Navigation Management
class NavigationManager {
    constructor() {
        this.navbar = document.getElementById('navbar');
        this.navMenu = document.getElementById('navMenu');
        this.mobileMenuToggle = document.getElementById('mobileMenuToggle');
        this.navLinks = document.querySelectorAll('.nav-link');
        this.init();
    }

    init() {
        this.bindEvents();
        this.handleScroll();
    }

    bindEvents() {
        // Mobile menu toggle
        if (this.mobileMenuToggle) {
            this.mobileMenuToggle.addEventListener('click', () => this.toggleMobileMenu());
        }

        // Navigation links
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => this.handleNavClick(e));
        });

        // Scroll handling
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    this.handleScroll();
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });

        // Close mobile menu on resize
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                this.closeMobileMenu();
            }
        });
    }

    toggleMobileMenu() {
        if (this.navMenu && this.mobileMenuToggle) {
            this.navMenu.classList.toggle('active');
            this.mobileMenuToggle.classList.toggle('active');
        }
    }

    closeMobileMenu() {
        if (this.navMenu && this.mobileMenuToggle) {
            this.navMenu.classList.remove('active');
            this.mobileMenuToggle.classList.remove('active');
        }
    }

    handleNavClick(e) {
        e.preventDefault();
        const href = e.target.getAttribute('href');
        
        if (href && href.startsWith('#')) {
            this.scrollToSection(href.substring(1));
            this.closeMobileMenu();
            this.updateActiveLink(e.target);
        }
    }

    scrollToSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            const offsetTop = section.offsetTop - 80;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    }

    updateActiveLink(activeLink) {
        this.navLinks.forEach(link => link.classList.remove('active'));
        activeLink.classList.add('active');
    }

    handleScroll() {
        // Update active navigation based on scroll position
        const sections = document.querySelectorAll('section[id]');
        const scrollPos = window.scrollY + 120;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');

            if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                this.navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }
}

// Task Management
class TaskManager {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('flowplan-tasks')) || [];
        this.taskIdCounter = parseInt(localStorage.getItem('flowplan-task-counter')) || 1;
        this.currentView = 'list'; // Track current view
        this.init();
    }

    init() {
        this.bindEvents();
        this.renderTasks();
        this.updateStats();
    }

    bindEvents() {
        const taskInput = document.getElementById('taskInput');
        const addTaskBtn = document.getElementById('addTaskBtn');
        const quickBtns = document.querySelectorAll('.quick-btn');
        const viewBtns = document.querySelectorAll('.view-btn');

        if (addTaskBtn) {
            addTaskBtn.addEventListener('click', () => this.addTask());
        }

        if (taskInput) {
            taskInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.addTask();
                }
            });
        }

        quickBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const taskText = btn.getAttribute('data-task');
                this.addTask(taskText);
            });
        });

        // View toggle functionality
        viewBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.getAttribute('data-view');
                this.switchView(view);
            });
        });
    }

    switchView(view) {
        this.currentView = view;
        const viewBtns = document.querySelectorAll('.view-btn');
        const taskList = document.getElementById('taskList');
        
        // Update active button
        viewBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-view') === view) {
                btn.classList.add('active');
            }
        });

        // Update task list class
        if (taskList) {
            taskList.classList.remove('list-view', 'grid-view');
            taskList.classList.add(`${view}-view`);
        }

        this.renderTasks();
    }

    addTask(taskText = null) {
        const taskInput = document.getElementById('taskInput');
        const text = taskText || (taskInput ? taskInput.value.trim() : '');
        
        if (!text) return;

        const task = {
            id: this.taskIdCounter++,
            text: text,
            completed: false,
            createdAt: new Date().toISOString(),
            completedAt: null
        };

        this.tasks.unshift(task);
        this.saveTasks();
        this.renderTasks();
        this.updateStats();
        this.updateSuggestions();

        if (taskInput) {
            taskInput.value = '';
        }

        // Add success feedback
        this.showTaskAddedFeedback();
    }

    toggleTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date().toISOString() : null;
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
        }
    }

    deleteTask(taskId) {
        this.tasks = this.tasks.filter(t => t.id !== taskId);
        this.saveTasks();
        this.renderTasks();
        this.updateStats();
    }

    renderTasks() {
        const taskList = document.getElementById('taskList');
        if (!taskList) return;

        if (this.tasks.length === 0) {
            taskList.innerHTML = `
                <div class="empty-state">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14,2 14,8 20,8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                        <polyline points="10,9 9,9 8,9"/>
                    </svg>
                    <h3>Ready to start planning?</h3>
                    <p>Add your first task above to begin your productive day!</p>
                </div>
            `;
            return;
        }

        // Apply current view class
        taskList.classList.remove('list-view', 'grid-view');
        taskList.classList.add(`${this.currentView}-view`);

        taskList.innerHTML = this.tasks.map(task => `
            <div class="task-item-card ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
                <div class="task-checkbox" onclick="taskManager.toggleTask(${task.id})"></div>
                <div class="task-content">
                    <div class="task-text">${task.text}</div>
                    <div class="task-time">${this.formatTime(task.createdAt)}</div>
                </div>
                <div class="task-actions">
                    <button class="task-action-btn" onclick="taskManager.deleteTask(${task.id})" title="Delete task">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3,6 5,6 21,6"/>
                            <path d="M19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"/>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');
    }

    updateStats() {
        const totalTasks = document.getElementById('totalTasks');
        const completedTasks = document.getElementById('completedTasks');
        const productivityScore = document.getElementById('productivityScore');

        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const productivity = total > 0 ? Math.round((completed / total) * 100) : 0;

        if (totalTasks) totalTasks.textContent = total;
        if (completedTasks) completedTasks.textContent = completed;
        if (productivityScore) productivityScore.textContent = `${productivity}%`;
    }

    updateSuggestions() {
        const suggestions = [
            "Take a 5-minute break between tasks",
            "Prioritize your most important task first",
            "Set a timer for focused work sessions",
            "Review your progress at the end of the day",
            "Break large tasks into smaller steps"
        ];

        const suggestionList = document.getElementById('suggestionList');
        if (suggestionList && this.tasks.length > 0) {
            const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
            suggestionList.innerHTML = `
                <div class="suggestion-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.07 2.07 0 0 1-2.44-2.44 2.07 2.07 0 0 1-2.44-2.44 2.07 2.07 0 0 1-2.44-2.44A2.5 2.5 0 0 1 2.5 10H12"/>
                    </svg>
                    <span>${randomSuggestion}</span>
                </div>
            `;
        }
    }

    formatTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    showTaskAddedFeedback() {
        const addTaskBtn = document.getElementById('addTaskBtn');
        if (addTaskBtn) {
            const originalHTML = addTaskBtn.innerHTML;
            addTaskBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20,6 9,17 4,12"/>
                </svg>
            `;
            addTaskBtn.style.background = 'var(--success)';
            
            setTimeout(() => {
                addTaskBtn.innerHTML = originalHTML;
                addTaskBtn.style.background = '';
            }, 1000);
        }
    }

    saveTasks() {
        localStorage.setItem('flowplan-tasks', JSON.stringify(this.tasks));
        localStorage.setItem('flowplan-task-counter', this.taskIdCounter.toString());
    }
}

// Pricing Toggle
class PricingManager {
    constructor() {
        this.isYearly = false;
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        const pricingToggle = document.getElementById('pricingToggle');
        if (pricingToggle) {
            pricingToggle.addEventListener('click', () => this.togglePricing());
        }
    }

    togglePricing() {
        this.isYearly = !this.isYearly;
        const toggle = document.getElementById('pricingToggle');
        const monthlyPrices = document.querySelectorAll('.monthly-price');
        const yearlyPrices = document.querySelectorAll('.yearly-price');

        if (toggle) {
            toggle.classList.toggle('active', this.isYearly);
        }

        monthlyPrices.forEach(price => {
            price.style.display = this.isYearly ? 'none' : 'inline';
        });

        yearlyPrices.forEach(price => {
            price.style.display = this.isYearly ? 'inline' : 'none';
        });
    }
}

// Modal Management
class ModalManager {
    constructor() {
        this.modalOverlay = document.getElementById('modalOverlay');
        this.modal = document.getElementById('modal');
        this.modalTitle = document.getElementById('modalTitle');
        this.modalBody = document.getElementById('modalBody');
        this.modalClose = document.getElementById('modalClose');
        
        this.paymentModalOverlay = document.getElementById('paymentModalOverlay');
        this.paymentModal = document.getElementById('paymentModal');
        this.paymentModalClose = document.getElementById('paymentModalClose');
        
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // Close modal events
        if (this.modalClose) {
            this.modalClose.addEventListener('click', () => this.closeModal());
        }
        
        if (this.paymentModalClose) {
            this.paymentModalClose.addEventListener('click', () => this.closePaymentModal());
        }

        // Close on overlay click
        if (this.modalOverlay) {
            this.modalOverlay.addEventListener('click', (e) => {
                if (e.target === this.modalOverlay) {
                    this.closeModal();
                }
            });
        }

        if (this.paymentModalOverlay) {
            this.paymentModalOverlay.addEventListener('click', (e) => {
                if (e.target === this.paymentModalOverlay) {
                    this.closePaymentModal();
                }
            });
        }

        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
                this.closePaymentModal();
            }
        });
    }

    showModal(title, content) {
        if (this.modalTitle && this.modalBody && this.modalOverlay) {
            this.modalTitle.textContent = title;
            this.modalBody.innerHTML = content;
            this.modalOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal() {
        if (this.modalOverlay) {
            this.modalOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    showPaymentModal(plan) {
        if (this.paymentModalOverlay) {
            this.setupPaymentForm(plan);
            this.paymentModalOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    closePaymentModal() {
        if (this.paymentModalOverlay) {
            this.paymentModalOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    setupPaymentForm(plan) {
        const planSummary = document.getElementById('planSummary');
        const paymentForm = document.getElementById('paymentForm');
        
        const planDetails = {
            free: { name: 'Free Plan', price: '$0', description: 'Perfect for getting started' },
            pro: { name: 'Pro Plan', price: '$12', description: 'For serious productivity' },
            enterprise: { name: 'Enterprise Plan', price: '$29', description: 'For large teams' }
        };

        const selectedPlan = planDetails[plan] || planDetails.free;

        if (planSummary) {
            planSummary.innerHTML = `
                <h4>${selectedPlan.name}</h4>
                <p>${selectedPlan.description}</p>
                <div class="plan-price">
                    <span>Total: ${selectedPlan.price}/month</span>
                </div>
            `;
        }

        if (paymentForm) {
            paymentForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.processPayment(selectedPlan);
            });
        }

        // Format card number input
        const cardNumberInput = document.getElementById('cardNumber');
        if (cardNumberInput) {
            cardNumberInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
                let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
                e.target.value = formattedValue;
            });
        }

        // Format expiry date input
        const expiryInput = document.getElementById('expiryDate');
        if (expiryInput) {
            expiryInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length >= 2) {
                    value = value.substring(0, 2) + '/' + value.substring(2, 4);
                }
                e.target.value = value;
            });
        }

        // Format CVV input
        const cvvInput = document.getElementById('cvv');
        if (cvvInput) {
            cvvInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/\D/g, '');
            });
        }
    }

    processPayment(plan) {
        // Simulate payment processing
        const submitBtn = document.querySelector('.payment-submit-btn');
        if (submitBtn) {
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2"/>
                </svg>
                Processing...
            `;
            submitBtn.disabled = true;

            setTimeout(() => {
                this.closePaymentModal();
                this.showSuccessModal(plan);
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }, 2000);
        }
    }

    showSuccessModal(plan) {
        const content = `
            <div class="modal-content">
                <div class="modal-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20,6 9,17 4,12"/>
                    </svg>
                </div>
                <div class="modal-text">
                    <h4>Payment Successful! 🎉</h4>
                    <p>Welcome to FlowPlan ${plan.name}! Your subscription is now active and you can start enjoying all the premium features.</p>
                    <p><strong>What's next?</strong></p>
                    <ul style="text-align: left; margin: 1rem 0;">
                        <li>✅ Access to unlimited tasks</li>
                        <li>✅ AI-powered suggestions</li>
                        <li>✅ Advanced analytics</li>
                        <li>✅ Team collaboration tools</li>
                    </ul>
                </div>
                <div class="modal-actions">
                    <button class="modal-btn modal-btn-primary" onclick="modalManager.closeModal(); scrollToSection('planner')">
                        Start Planning Now
                    </button>
                </div>
            </div>
        `;
        this.showModal('Welcome to FlowPlan!', content);
    }
}

// Contact Form Management
class ContactManager {
    constructor() {
        this.contactForm = document.getElementById('contactForm');
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        if (this.contactForm) {
            this.contactForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSubmit();
            });
        }
    }

    handleSubmit() {
        const submitBtn = document.querySelector('.contact-submit-btn');
        if (submitBtn) {
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2"/>
                </svg>
                Sending...
            `;
            submitBtn.disabled = true;

            setTimeout(() => {
                this.showSuccessMessage();
                this.contactForm.reset();
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }, 1500);
        }
    }

    showSuccessMessage() {
        const content = `
            <div class="modal-content">
                <div class="modal-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                    </svg>
                </div>
                <div class="modal-text">
                    <h4>Message Sent Successfully! 📧</h4>
                    <p>Thank you for reaching out to us! We've received your message and our team will get back to you within 24 hours.</p>
                    <p>In the meantime, feel free to explore FlowPlan and start planning your productive day!</p>
                </div>
                <div class="modal-actions">
                    <button class="modal-btn modal-btn-primary" onclick="modalManager.closeModal(); scrollToSection('planner')">
                        Try FlowPlan Now
                    </button>
                </div>
            </div>
        `;
        modalManager.showModal('Message Sent!', content);
    }
}

// Button Actions
class ActionManager {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // Hero actions
        document.addEventListener('click', (e) => {
            const action = e.target.closest('[data-action]');
            if (action) {
                const actionType = action.getAttribute('data-action');
                this.handleAction(actionType);
            }
        });

        // Plan buttons
        document.addEventListener('click', (e) => {
            const planBtn = e.target.closest('[data-plan]');
            if (planBtn) {
                const plan = planBtn.getAttribute('data-plan');
                this.handlePlanSelection(plan);
            }
        });
    }

    handleAction(actionType) {
        switch (actionType) {
            case 'start-planning':
                this.scrollToSection('planner');
                break;
            case 'explore-features':
                this.scrollToSection('features');
                break;
            case 'start-free':
                this.scrollToSection('pricing');
                break;
            case 'schedule-demo':
                this.showDemoModal();
                break;
        }
    }

    handlePlanSelection(plan) {
        if (plan === 'free') {
            this.showFreeSignupModal();
        } else if (plan === 'enterprise') {
            this.scrollToSection('contact');
        } else {
            modalManager.showPaymentModal(plan);
        }
    }

    scrollToSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            const offsetTop = section.offsetTop - 80;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    }

    showFreeSignupModal() {
        const content = `
            <div class="modal-content">
                <div class="modal-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22,4 12,14.01 9,11.01"/>
                    </svg>
                </div>
                <div class="modal-text">
                    <h4>Welcome to FlowPlan Free! 🎉</h4>
                    <p>You're all set to start planning with FlowPlan! Your free account includes:</p>
                    <ul style="text-align: left; margin: 1rem 0;">
                        <li>✅ Up to 50 tasks</li>
                        <li>✅ Basic analytics</li>
                        <li>✅ Mobile app access</li>
                        <li>✅ Cloud synchronization</li>
                    </ul>
                    <p>Start adding your tasks and experience the power of smart planning!</p>
                </div>
                <div class="modal-actions">
                    <button class="modal-btn modal-btn-primary" onclick="modalManager.closeModal(); scrollToSection('planner')">
                        Start Planning Now
                    </button>
                    <button class="modal-btn modal-btn-secondary" onclick="modalManager.closeModal(); scrollToSection('pricing')">
                        View Upgrade Options
                    </button>
                </div>
            </div>
        `;
        modalManager.showModal('Welcome to FlowPlan!', content);
    }

    showDemoModal() {
        const content = `
            <div class="modal-content">
                <div class="modal-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                </div>
                <div class="modal-text">
                    <h4>Schedule Your Personal Demo 📅</h4>
                    <p>Great choice! Our product specialists would love to show you how FlowPlan can transform your productivity.</p>
                    <p><strong>What you'll get in your demo:</strong></p>
                    <ul style="text-align: left; margin: 1rem 0;">
                        <li>🎯 Personalized productivity assessment</li>
                        <li>🚀 Live walkthrough of advanced features</li>
                        <li>💡 Custom setup recommendations</li>
                        <li>🎁 Exclusive demo discount (30% off)</li>
                    </ul>
                    <p>In the meantime, try our interactive planner below!</p>
                </div>
                <div class="modal-actions">
                    <button class="modal-btn modal-btn-primary" onclick="modalManager.closeModal(); scrollToSection('contact')">
                        Contact Us to Schedule
                    </button>
                    <button class="modal-btn modal-btn-secondary" onclick="modalManager.closeModal(); scrollToSection('planner')">
                        Try Interactive Demo
                    </button>
                </div>
            </div>
        `;
        modalManager.showModal('Schedule Demo', content);
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Set current date
    const currentDate = document.getElementById('currentDate');
    if (currentDate) {
        const today = new Date();
        currentDate.textContent = today.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
        });
    }

    // Initialize managers
    new ThemeManager();
    new NavigationManager();
    window.taskManager = new TaskManager(); // Make it global for onclick handlers
    new PricingManager();
    window.modalManager = new ModalManager(); // Make it global for onclick handlers
    new ContactManager();
    new ActionManager();

    // Add smooth hover effects for cards
    const cards = document.querySelectorAll('.feature-card, .pricing-card, .testimonial-card, .contact-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            if (!this.classList.contains('featured')) {
                this.style.transform = 'translateY(-8px)';
            }
        });
        
        card.addEventListener('mouseleave', function() {
            if (!this.classList.contains('featured')) {
                this.style.transform = 'translateY(0)';
            }
        });
    });

    // Animate stats on scroll
    const observerOptions = {
        threshold: 0.5,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe elements for animation
    const animateElements = document.querySelectorAll('.feature-card, .pricing-card, .testimonial-card, .contact-card');
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        observer.observe(el);
    });
});

// Global utility functions
window.scrollToSection = function(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        const offsetTop = section.offsetTop - 80;
        window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
        });
    }
};