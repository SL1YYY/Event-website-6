// Security Configuration
const SECURITY_CONFIG = {
    validTokens: ["TOKEN-123", "TOKEN-456", "TOKEN-789"],
    lootlabsUrl: "https://lootlabs.net/placeholder-will-update-later", // Replace with your LootLabs campaign link
    robloxEventUrl: "https://www.roblox.com/games/placeholder/Event-Game", // Replace with your actual game link
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
    updateTimestamps();
});

// BALANCED Security - Less aggressive but still protective
function initializeSecurity() {
    // Basic protection
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('keydown', handleKeyDown);
    
    // DevTools detection (less aggressive - only warns, doesn't auto-redirect)
    detectDevToolsBalanced();
    
    // Check for URL token parameters
    if (window.location.pathname.includes('redirect.html')) {
        checkUrlToken();
        validateAccess();
    }
    
    // Monitor for obvious automation
    detectObviousAutomation();
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

// Balanced DevTools detection - doesn't auto-redirect
function detectDevToolsBalanced() {
    const threshold = 160;
    let warningShown = false;
    
    function check() {
        if (window.outerHeight - window.innerHeight > threshold || 
            window.outerWidth - window.innerWidth > threshold) {
            if (!securityState.devToolsDetected) {
                securityState.devToolsDetected = true;
                logSecurityEvent('DevTools potentially detected');
                
                // Only show warning, don't auto-redirect
                if (!warningShown && Math.random() > 0.5) {
                    console.warn('⚠️ Please close developer tools for the best experience');
                    warningShown = true;
                }
            }
        }
    }
    
    // Check less frequently
    setInterval(check, 5000);
}

// Only detect obvious automation (not normal users)
function detectObviousAutomation() {
    if (navigator.webdriver || 
        window.phantom || 
        window.callPhantom ||
        window._phantom) {
        logSecurityEvent('Obvious automation detected');
        handleSecurityViolation('automation');
    }
}

// Validate access but be less strict
function validateAccess() {
    const referrer = document.referrer;
    
    // Only block if COMPLETELY invalid referrer AND suspicious activity
    if (!referrer && securityState.devToolsDetected && securityState.suspiciousActivity) {
        logSecurityEvent('Multiple security concerns detected');
        setTimeout(() => {
            if (Math.random() > 0.7) { // Only 30% chance to redirect
                redirectToBypass('Multiple security violations detected');
            }
        }, 10000); // Wait 10 seconds before checking
    }
}

// Check for token in URL (from LootLabs redirect)
function checkUrlToken() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
        // Auto-fill the token input
        const tokenInput = document.getElementById('accessToken');
        if (tokenInput) {
            tokenInput.value = token.toUpperCase();
            // Auto-validate after a short delay
            setTimeout(() => {
                validateAccessToken();
            }, 1000);
        }
    }
}

function generateSessionId() {
    return 'SES-' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

function logSecurityEvent(event) {
    console.log(`[SECURITY] ${new Date().toISOString()}: ${event}`);
    
    // Store security events but don't let them trigger auto-redirects
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
        case 'automation':
            // Only redirect for obvious automation
            redirectToBypass('Automated access detected');
            break;
        case 'devtools':
            // Don't auto-redirect for DevTools anymore
            logSecurityEvent('DevTools usage noted');
            break;
        case 'excessive-attempts':
            redirectToBypass('Too many failed attempts');
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
            
            // Redirect to LootLabs
            setTimeout(() => {
                window.location.href = SECURITY_CONFIG.lootlabsUrl;
            }, 1500);
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
        handleSecurityViolation('excessive-attempts');
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
                    handleSecurityViolation('excessive-attempts');
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
    if (successSection) {
        successSection.style.animation = 'successSlide 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
    }
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
        timestampEl.textContent = '2025-08-08 09:52:42 UTC';
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
    const utcString = '2025-08-08 09:52:42 UTC';
    
    // Update any timestamp elements
    const timestampElements = document.querySelectorAll('[id*="timestamp"], .timestamp');
    timestampElements.forEach(el => {
        if (el.textContent.includes('UTC') || el.textContent.includes('2025')) {
            el.textContent = utcString;
        }
    });
}

// Initialize security logging
logSecurityEvent('Security system initialized for user: SL1YYY');
