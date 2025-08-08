// Security Configuration
const SECURITY_CONFIG = {
    validTokens: ["TOKEN-123", "TOKEN-456", "TOKEN-789"],
    lootlabsUrl: "https://lootlabs.net/link/placeholder",
    robloxEventUrl: "https://www.roblox.com/games/123456789/Event-Game",
    discordUrl: "https://discord.gg/dyGvnnymbHj",
    maxAttempts: 3,
    sessionTimeout: 86400000 // 24 hours
};

// Security State
let securityState = {
    attempts: 0,
    blocked: false,
    devToolsDetected: false,
    suspiciousActivity: false,
    sessionId: generateSessionId(),
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString()
};

// Initialize everything when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    initializeSecurity();
    initializePageLogic();
    startSecurityMonitoring();
    updateTimestamps();
});

// Security Functions
function initializeSecurity() {
    detectDevTools();
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('keydown', handleKeyDown);
    
    if (window.location.pathname.includes('redirect.html')) {
        validateReferrer();
    }
    
    detectAutomation();
    validateSession();
}

function detectDevTools() {
    const threshold = 160;
    
    function check() {
        if (window.outerHeight - window.innerHeight > threshold || 
            window.outerWidth - window.innerWidth > threshold) {
            if (!securityState.devToolsDetected) {
                securityState.devToolsDetected = true;
                logSecurityEvent('DevTools detected');
                handleSecurityViolation('devtools');
            }
        }
    }
    
    setInterval(check, 1000);
}

function handleKeyDown(e) {
    if (e.key === 'F12' || 
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.shiftKey && e.key === 'C') ||
        (e.ctrlKey && e.key === 'u') ||
        (e.ctrlKey && e.key === 's')) {
        e.preventDefault();
        logSecurityEvent('Blocked keyboard shortcut: ' + e.key);
        return false;
    }
}

function validateReferrer() {
    const validReferrers = [
        'https://lootlabs.net',
        window.location.origin
    ];
    
    const referrer = document.referrer;
    if (!referrer) {
        logSecurityEvent('No referrer detected');
        return;
    }
    
    let isValidReferrer = false;
    for (let validRef of validReferrers) {
        if (referrer.startsWith(validRef)) {
            isValidReferrer = true;
            break;
        }
    }
    
    if (!isValidReferrer) {
        logSecurityEvent('Invalid referrer: ' + referrer);
        redirectToBypass('Invalid referrer detected');
    }
}

function detectAutomation() {
    if (navigator.webdriver || 
        window.phantom || 
        window.callPhantom ||
        window._phantom ||
        window.Buffer ||
        window.emit ||
        window.spawn) {
        logSecurityEvent('Automation detected');
        handleSecurityViolation('automation');
    }
    
    let mouseEvents = 0;
    document.addEventListener('mousemove', () => {
        mouseEvents++;
    });
    
    setTimeout(() => {
        if (mouseEvents === 0) {
            logSecurityEvent('No mouse activity detected');
            securityState.suspiciousActivity = true;
        }
    }, 5000);
}

function validateSession() {
    const sessionData = localStorage.getItem('eventSession');
    if (sessionData) {
        try {
            const session = JSON.parse(sessionData);
            if (Date.now() - session.created > SECURITY_CONFIG.sessionTimeout) {
                localStorage.removeItem('eventSession');
                logSecurityEvent('Session expired');
            }
        } catch (e) {
            localStorage.removeItem('eventSession');
            logSecurityEvent('Invalid session data');
        }
    }
}

function generateSessionId() {
    return 'SES-' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

function logSecurityEvent(event) {
    console.log(`[SECURITY] ${new Date().toISOString()}: ${event}`);
    
    const events = JSON.parse(localStorage.getItem('securityEvents') || '[]');
    events.push({
        timestamp: new Date().toISOString(),
        event: event,
        userAgent: navigator.userAgent,
        url: window.location.href
    });
    
    if (events.length > 50) {
        events.splice(0, events.length - 50);
    }
    
    localStorage.setItem('securityEvents', JSON.stringify(events));
}

function handleSecurityViolation(type) {
    securityState.suspiciousActivity = true;
    
    switch (type) {
        case 'devtools':
            if (Math.random() > 0.7) {
                redirectToBypass('DevTools usage detected');
            }
            break;
        case 'automation':
            redirectToBypass('Automated access detected');
            break;
        case 'referrer':
            redirectToBypass('Invalid access method');
            break;
    }
}

function redirectToBypass(reason) {
    logSecurityEvent('Redirecting to bypass page: ' + reason);
    localStorage.setItem('bypassReason', reason);
    window.location.href = 'bypass.html';
}

// Page-specific Logic
function initializePageLogic() {
    const currentPage = getCurrentPage();
    
    switch (currentPage) {
        case 'index':
            initializeIndexPage();
            break;
        case 'redirect':
            initializeRedirectPage();
            break;
        case 'bypass':
            initializeBypassPage();
            break;
    }
}

function getCurrentPage() {
    const path = window.location.pathname;
    if (path.includes('redirect.html')) return 'redirect';
    if (path.includes('bypass.html')) return 'bypass';
    return 'index';
}

// Index Page Logic
function initializeIndexPage() {
    const beginBtn = document.getElementById('beginAccess');
    if (beginBtn) {
        beginBtn.addEventListener('click', function() {
            // Add visual feedback
            this.style.transform = 'scale(0.98)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
            
            if (securityState.suspiciousActivity) {
                redirectToBypass('Suspicious activity detected');
                return;
            }
            
            // Create session
            const sessionData = {
                created: Date.now(),
                sessionId: securityState.sessionId,
                stage: 'verification'
            };
            localStorage.setItem('eventSession', JSON.stringify(sessionData));
            
            logSecurityEvent('User initiated access process');
            
            // Show loading state
            this.innerHTML = '<span>Opening Verification...</span>';
            this.disabled = true;
            
            // Open LootLabs in new tab
            window.open(SECURITY_CONFIG.lootlabsUrl, '_blank');
            
            // Redirect to verification page
            setTimeout(() => {
                window.location.href = 'redirect.html';
            }, 2000);
        });
    }
}

// Redirect Page Logic
function initializeRedirectPage() {
    const tokenInput = document.getElementById('accessToken');
    const validateBtn = document.getElementById('validateToken');
    const eventBtn = document.getElementById('eventButton');
    
    if (tokenInput && validateBtn) {
        validateBtn.addEventListener('click', function() {
            validateAccessToken();
        });
        
        tokenInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                validateAccessToken();
            }
        });
        
        tokenInput.addEventListener('input', function() {
            // Clear any error states when user starts typing
            const errorSection = document.getElementById('errorSection');
            if (errorSection && !errorSection.classList.contains('hidden')) {
                errorSection.classList.add('hidden');
            }
        });
    }
    
    if (eventBtn) {
        eventBtn.addEventListener('click', function() {
            const link = this.getAttribute('data-link');
            if (link && link !== '') {
                logSecurityEvent('User accessed event');
                // Add click animation
                this.style.transform = 'scale(0.98)';
                setTimeout(() => {
                    this.style.transform = '';
                    window.open(link, '_blank');
                }, 150);
            }
        });
    }
    
    // Auto-focus token input
    if (tokenInput) {
        setTimeout(() => tokenInput.focus(), 500);
    }
    
    checkExistingSession();
}

function validateAccessToken() {
    const tokenInput = document.getElementById('accessToken');
    const token = tokenInput.value.trim().toUpperCase();
    
    if (!token) {
        showError('Please enter an access token');
        return;
    }
    
    // Check attempts
    securityState.attempts++;
    if (securityState.attempts > SECURITY_CONFIG.maxAttempts) {
        logSecurityEvent('Too many validation attempts');
        redirectToBypass('Too many failed attempts');
        return;
    }
    
    showLoadingState();
    
    setTimeout(() => {
        if (isValidToken(token)) {
            showSuccess(token);
            logSecurityEvent('Valid token provided: ' + token);
        } else {
            showError('Invalid token. Please check your token and try again.');
            logSecurityEvent('Invalid token attempt: ' + token);
            
            if (securityState.attempts >= SECURITY_CONFIG.maxAttempts) {
                setTimeout(() => {
                    redirectToBypass('Maximum attempts exceeded');
                }, 2000);
            }
        }
    }, 2000);
}

function isValidToken(token) {
    return SECURITY_CONFIG.validTokens.includes(token);
}

function showLoadingState() {
    const title = document.getElementById('verificationTitle');
    const spinner = document.getElementById('loadingSpinner');
    const statusText = document.getElementById('statusText');
    const tokenSection = document.getElementById('tokenInput');
    const validateBtn = document.getElementById('validateToken');
    
    if (title) title.textContent = 'Validating Access Token...';
    if (spinner) spinner.classList.remove('hidden');
    if (statusText) statusText.textContent = 'Verifying...';
    if (tokenSection) tokenSection.style.opacity = '0.5';
    if (validateBtn) {
        validateBtn.disabled = true;
        validateBtn.innerHTML = '<span>Validating...</span>';
    }
}

function showSuccess(token) {
    const tokenSection = document.getElementById('tokenInput');
    const successSection = document.getElementById('successSection');
    const errorSection = document.getElementById('errorSection');
    const eventBtn = document.getElementById('eventButton');
    const expiryTime = document.getElementById('expiryTime');
    
    if (tokenSection) tokenSection.classList.add('hidden');
    if (errorSection) errorSection.classList.add('hidden');
    if (successSection) successSection.classList.remove('hidden');
    
    if (eventBtn) {
        eventBtn.setAttribute('data-link', SECURITY_CONFIG.robloxEventUrl);
    }
    
    if (expiryTime) {
        const expiry = new Date(Date.now() + SECURITY_CONFIG.sessionTimeout);
        expiryTime.textContent = expiry.toISOString().replace('T', ' ').split('.')[0] + ' UTC';
    }
    
    // Store successful validation
    const sessionData = JSON.parse(localStorage.getItem('eventSession') || '{}');
    sessionData.validated = true;
    sessionData.token = hashToken(token);
    sessionData.validatedAt = Date.now();
    localStorage.setItem('eventSession', JSON.stringify(sessionData));
    
    // Add success animation
    successSection.style.animation = 'successSlide 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
}

function showError(message) {
    const tokenSection = document.getElementById('tokenInput');
    const successSection = document.getElementById('successSection');
    const errorSection = document.getElementById('errorSection');
    const errorMessage = document.getElementById('errorMessage');
    const retryBtn = document.getElementById('retryButton');
    const spinner = document.getElementById('loadingSpinner');
    const statusText = document.getElementById('statusText');
    const validateBtn = document.getElementById('validateToken');
    
    if (tokenSection) tokenSection.style.opacity = '1';
    if (successSection) successSection.classList.add('hidden');
    if (errorSection) errorSection.classList.remove('hidden');
    if (errorMessage) errorMessage.textContent = message;
    if (spinner) spinner.classList.add('hidden');
    if (statusText) statusText.textContent = 'Ready';
    if (validateBtn) {
        validateBtn.disabled = false;
        validateBtn.innerHTML = '<span>Validate Token</span>';
    }
    
    if (retryBtn) {
        retryBtn.addEventListener('click', function() {
            if (errorSection) errorSection.classList.add('hidden');
            document.getElementById('accessToken').value = '';
            document.getElementById('accessToken').focus();
        });
    }
}

function checkExistingSession() {
    const sessionData = localStorage.getItem('eventSession');
    if (sessionData) {
        try {
            const session = JSON.parse(sessionData);
            if (session.validated && 
                Date.now() - session.validatedAt < SECURITY_CONFIG.sessionTimeout) {
                setTimeout(() => {
                    showSuccess('EXISTING-SESSION');
                }, 1000);
                logSecurityEvent('Existing valid session found');
            }
        } catch (e) {
            localStorage.removeItem('eventSession');
        }
    }
}

function hashToken(token) {
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
        const char = token.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString(36);
}

// Bypass Page Logic
function initializeBypassPage() {
    const goHomeBtn = document.getElementById('goHome');
    const contactSupportBtn = document.getElementById('contactSupport');
    
    if (goHomeBtn) {
        goHomeBtn.addEventListener('click', function() {
            // Add click animation
            this.style.transform = 'scale(0.98)';
            setTimeout(() => {
                localStorage.clear();
                window.location.href = 'index.html';
            }, 150);
        });
    }
    
    if (contactSupportBtn) {
        contactSupportBtn.addEventListener('click', function() {
            // Add click animation
            this.style.transform = 'scale(0.98)';
            setTimeout(() => {
                this.style.transform = '';
                window.open(SECURITY_CONFIG.discordUrl, '_blank');
            }, 150);
        });
    }
    
    updateSessionInfo();
    
    const bypassReason = localStorage.getItem('bypassReason');
    if (bypassReason) {
        logSecurityEvent('Bypass page accessed: ' + bypassReason);
        localStorage.removeItem('bypassReason');
    }
    
    localStorage.removeItem('eventSession');
    animateViolations();
}

function updateSessionInfo() {
    const timestampEl = document.getElementById('timestamp');
    const userAgentEl = document.getElementById('userAgent');
    const sessionIdEl = document.getElementById('sessionId');
    const userLoginEl = document.getElementById('userLogin');
    
    if (timestampEl) {
        timestampEl.textContent = new Date().toISOString().replace('T', ' ').split('.')[0] + ' UTC';
    }
    
    if (userAgentEl) {
        const ua = navigator.userAgent;
        let simplified = 'Unknown Browser';
        if (ua.includes('Chrome')) simplified = 'Chrome';
        else if (ua.includes('Safari')) simplified = 'Safari';
        else if (ua.includes('Firefox')) simplified = 'Firefox';
        else if (ua.includes('Edge')) simplified = 'Edge';
        
        if (ua.includes('Mobile')) simplified += ' (Mobile)';
        userAgentEl.textContent = simplified;
    }
    
    if (sessionIdEl) {
        sessionIdEl.textContent = securityState.sessionId + '-BYPASS-DETECTED';
    }
    
    if (userLoginEl) {
        userLoginEl.textContent = 'SL1YYY';
    }
}

function animateViolations() {
    const violations = document.querySelectorAll('.violation-list .step-card');
    violations.forEach((violation, index) => {
        setTimeout(() => {
            violation.style.opacity = '1';
            violation.style.transform = 'translateX(0)';
        }, index * 200);
    });
}

// Update timestamps throughout the site
function updateTimestamps() {
    const now = new Date();
    const utcString = now.toISOString().replace('T', ' ').split('.')[0] + ' UTC';
    
    // Update any timestamp elements
    const timestampElements = document.querySelectorAll('[id*="timestamp"], .timestamp');
    timestampElements.forEach(el => {
        if (el.textContent.includes('UTC') || el.textContent.includes('2025')) {
            el.textContent = utcString;
        }
    });
}

// Security Monitoring
function startSecurityMonitoring() {
    let clickCount = 0;
    let rapidClicks = 0;
    
    document.addEventListener('click', function(e) {
        clickCount++;
        rapidClicks++;
        
        // Add click effect to buttons
        if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
            const btn = e.target.tagName === 'BUTTON' ? e.target : e.target.closest('button');
            btn.style.transform = 'scale(0.98)';
            setTimeout(() => {
                btn.style.transform = '';
            }, 150);
        }
        
        setTimeout(() => {
            rapidClicks = 0;
        }, 1000);
        
        if (rapidClicks > 10) {
            logSecurityEvent('Rapid clicking detected');
            securityState.suspiciousActivity = true;
        }
    });
    
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            logSecurityEvent('Tab hidden');
        } else {
            logSecurityEvent('Tab visible');
        }
    });
    
    window.addEventListener('focus', function() {
        logSecurityEvent('Window focused');
    });
    
    window.addEventListener('blur', function() {
        logSecurityEvent('Window blurred');
    });
    
    setInterval(performSecurityCheck, 30000);
}

function performSecurityCheck() {
    const scripts = document.querySelectorAll('script');
    const expectedScripts = ['script.js'];
    
    scripts.forEach(script => {
        if (script.src && !expectedScripts.some(expected => script.src.includes(expected))) {
            logSecurityEvent('Unexpected script detected: ' + script.src);
            handleSecurityViolation('script-injection');
        }
    });
    
    try {
        const testData = localStorage.getItem('securityEvents');
        if (testData) {
            JSON.parse(testData);
        }
    } catch (e) {
        logSecurityEvent('Local storage corruption detected');
        localStorage.clear();
    }
}

// Anti-debugging measures
(() => {
    let devtools = false;
    let threshold = 160;
    
    function detectDevTools() {
        if (window.outerHeight - window.innerHeight > threshold || 
            window.outerWidth - window.innerWidth > threshold) {
            devtools = true;
        }
    }
    
    function randomDelay() {
        return Math.floor(Math.random() * 1000) + 500;
    }
    
    setInterval(() => {
        detectDevTools();
        if (devtools && Math.random() > 0.8) {
            if (window.location.pathname !== '/bypass.html') {
                redirectToBypass('DevTools detected during monitoring');
            }
        }
    }, randomDelay());
})();

// Initialize security logging
logSecurityEvent('Security system initialized for user: SL1YYY');