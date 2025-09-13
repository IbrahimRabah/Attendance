// Authentication System for Attendance Management
window.AttendanceAuth = (function() {
    'use strict';

    const AUTH_KEY = 'attendance_auth_token';
    const USER_KEY = 'attendance_user_info';
    
    // Valid credentials
    const VALID_CREDENTIALS = {
        email: 'Moumen@eid.com',
        password: 'Moumen@'
    };

    // Private methods
    function generateToken() {
        return btoa(JSON.stringify({
            timestamp: Date.now(),
            user: VALID_CREDENTIALS.email
        }));
    }

    function isTokenValid(token) {
        try {
            const decoded = JSON.parse(atob(token));
            // Token expires after 24 hours
            const tokenAge = Date.now() - decoded.timestamp;
            const maxAge = 24 * 60 * 60 * 1000; // 24 hours
            
            return tokenAge < maxAge && decoded.user === VALID_CREDENTIALS.email;
        } catch (e) {
            return false;
        }
    }

    // Public API
    return {
        login: function(email, password) {
            if (email === VALID_CREDENTIALS.email && password === VALID_CREDENTIALS.password) {
                const token = generateToken();
                const userInfo = {
                    email: email,
                    name: 'مؤمن عيد',
                    loginTime: new Date().toISOString()
                };

                localStorage.setItem(AUTH_KEY, token);
                localStorage.setItem(USER_KEY, JSON.stringify(userInfo));
                
                return {
                    success: true,
                    message: 'تم تسجيل الدخول بنجاح'
                };
            } else {
                return {
                    success: false,
                    message: 'بيانات الدخول غير صحيحة'
                };
            }
        },

        logout: function() {
            localStorage.removeItem(AUTH_KEY);
            localStorage.removeItem(USER_KEY);
            
            // Show logout success message briefly then redirect
            if (typeof showNotification === 'function') {
                showNotification('تم تسجيل الخروج بنجاح', 'success');
            }
            
            // Redirect to login page after a brief delay
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1000);
        },

        isLoggedIn: function() {
            const token = localStorage.getItem(AUTH_KEY);
            return token && isTokenValid(token);
        },

        getCurrentUser: function() {
            if (this.isLoggedIn()) {
                const userInfo = localStorage.getItem(USER_KEY);
                return userInfo ? JSON.parse(userInfo) : null;
            }
            return null;
        },

        // Check authentication and redirect if needed
        requireAuth: function() {
            return this.isLoggedIn();
        }
    };
})();

// Manual authentication check - only call when needed
window.AttendanceAuth.checkAuthOnPageLoad = function() {
    // Only check if we're not on the login page
    if (!window.location.href.includes('login.html')) {
        if (!this.isLoggedIn()) {
            window.location.href = 'login.html';
            return false;
        }
    }
    return true;
};

// Single authentication check on page load - runs only once
(function() {
    // Only run if not on login page
    if (!window.location.href.includes('login.html')) {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                if (!window.AttendanceAuth.isLoggedIn()) {
                    window.location.href = 'login.html';
                }
            });
        } else {
            // DOM is already ready
            if (!window.AttendanceAuth.isLoggedIn()) {
                window.location.href = 'login.html';
            }
        }
    }
})();