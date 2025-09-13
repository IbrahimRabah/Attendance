// Login Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('Login page loaded');
    console.log('AttendanceAuth available:', !!window.AttendanceAuth);
    
    // Check if user is already logged in using unified auth
    if (window.AttendanceAuth && window.AttendanceAuth.isLoggedIn()) {
        console.log('User already logged in, redirecting...');
        window.location.href = 'index.html';
        return;
    }

    // Elements
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const passwordToggle = document.getElementById('passwordToggle');
    const loginBtn = document.getElementById('loginBtn');
    const btnText = document.querySelector('.btn-text');
    const btnLoading = document.querySelector('.btn-loading');
    const loginAlert = document.getElementById('loginAlert');
    const alertMessage = document.getElementById('alertMessage');
    const rememberMeCheck = document.getElementById('rememberMe');

    // Valid credentials
    const VALID_USERNAME = 'Moumen@eid.com';
    const VALID_PASSWORD = 'Moumen@';

    // Password toggle functionality
    passwordToggle.addEventListener('click', function() {
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
        
        const icon = this.querySelector('i');
        if (type === 'password') {
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        } else {
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        }
    });

    // Input validation and styling
    function validateInput(input) {
        const value = input.value.trim();
        const wrapper = input.closest('.input-wrapper');
        
        if (value === '') {
            wrapper.classList.remove('valid', 'invalid');
            return false;
        } else if (input.type === 'email' && !isValidEmail(value)) {
            wrapper.classList.remove('valid');
            wrapper.classList.add('invalid');
            return false;
        } else {
            wrapper.classList.remove('invalid');
            wrapper.classList.add('valid');
            return true;
        }
    }

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Real-time validation
    usernameInput.addEventListener('input', function() {
        validateInput(this);
        hideAlert();
    });

    passwordInput.addEventListener('input', function() {
        validateInput(this);
        hideAlert();
    });

    // Show/hide alert
    function showAlert(message, type = 'danger') {
        alertMessage.textContent = message;
        loginAlert.className = `alert alert-${type}`;
        loginAlert.classList.remove('d-none');
        
        // Scroll to alert if needed
        loginAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function hideAlert() {
        loginAlert.classList.add('d-none');
    }

    // Loading state
    function setLoading(loading) {
        if (loading) {
            loginBtn.disabled = true;
            btnText.classList.add('d-none');
            btnLoading.classList.remove('d-none');
        } else {
            loginBtn.disabled = false;
            btnText.classList.remove('d-none');
            btnLoading.classList.add('d-none');
        }
    }

    // Login form submission
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        const rememberMe = rememberMeCheck.checked;

        // Validate inputs
        if (!username || !password) {
            showAlert('يرجى ملء جميع الحقول المطلوبة');
            return;
        }

        if (!isValidEmail(username)) {
            showAlert('يرجى إدخال بريد إلكتروني صحيح');
            usernameInput.focus();
            return;
        }

        // Show loading
        setLoading(true);
        hideAlert();

        // Simulate network delay for better UX
        setTimeout(() => {
            try {
                // Check if AttendanceAuth is available
                if (!window.AttendanceAuth) {
                    console.error('AttendanceAuth not available');
                    setLoading(false);
                    showAlert('خطأ في النظام - يرجى إعادة تحميل الصفحة');
                    return;
                }

                // Use the unified authentication system
                const result = window.AttendanceAuth.login(username, password);
                console.log('Login result:', result);
                
                if (result.success) {
                    // Success
                    showAlert(result.message + ' جاري التحويل...', 'success');
                    
                    // Redirect after short delay
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1500);
                    
                } else {
                    // Failed
                    setLoading(false);
                    showAlert(result.message);
                    
                    // Clear password
                    passwordInput.value = '';
                    passwordInput.focus();
                    
                    // Add shake animation
                    loginForm.style.animation = 'shake 0.5s ease-in-out';
                    setTimeout(() => {
                        loginForm.style.animation = '';
                    }, 500);
                }
            } catch (error) {
                console.error('Login error:', error);
                setLoading(false);
                showAlert('حدث خطأ أثناء تسجيل الدخول');
            }
        }, 1000);
    });

    // Add shake animation keyframes to document
    const style = document.createElement('style');
    style.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        
        .input-wrapper.valid .form-control {
            border-color: #28a745;
            background-color: #f8fff9;
        }
        
        .input-wrapper.invalid .form-control {
            border-color: #dc3545;
            background-color: #fff8f8;
        }
        
        .input-wrapper.valid .input-icon {
            color: #28a745;
        }
        
        .input-wrapper.invalid .input-icon {
            color: #dc3545;
        }
    `;
    document.head.appendChild(style);

    // Handle keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !loginBtn.disabled) {
            loginForm.dispatchEvent(new Event('submit'));
        }
    });

    // Focus first input on load
    setTimeout(() => {
        usernameInput.focus();
    }, 500);
});