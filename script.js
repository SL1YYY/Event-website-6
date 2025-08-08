// Security Configuration
const SECURITY_CONFIG = {
    validTokens: ["TOKEN-123", "TOKEN-456", "TOKEN-789"],
    lootlabsUrl: "https://lootlabs.net/placeholder-will-update-later", // Replace with your LootLabs campaign link
    robloxEventUrl: "https://www.roblox.com/games/placeholder/Event-Game", // Replace with your actual game link
    discordUrl: "https://discord.gg/dyGvnnymbHj",
    maxAttempts: 5,
    sessionTimeout: 86400000 // 24 hours
};

// Security State
let securityState = {
    attempts: 0,
    sessionId: generateSessionId(),
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString()
};

// Initialize everything when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    initializeBasicSecurity();
    initializePageLogic();
    updateTimestamps();
});

// BALANCED Security - Protects against bypassing but not overly aggressive
function initializeBasicSecurity() {
    // Basic protection
    document.addEventListener('contextmenu', e => e.preventDefault());
    
    // Block common dev shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.key === 'F12' || 
            (e.ctrlKey && e.shiftKey && e.key === 'I') ||
            (e.ctrlKey && e.key === 'u')) {
            e.preventDefault();
            logSecurityEvent('Blocked shortcut: ' + e.key);
        }
    });
    
    // IMPORTANT: Check referrer on redirect page to prevent bypassing
    if (window.location.pathname.includes('redirect.html')) {
        validateReferrer();
        checkUrlToken();
    }
}

// Prevent direct access to redirect.html (bypass protection)
function validateReferrer() {
    const referrer = document.referrer;
    const currentDomain = window.location.origin;
    
    // Allow if coming from LootLabs, your own site, or has valid session
    const validReferrers = [
        'lootlabs',
        'loot-link', 
        'loot-labs',
        currentDomain
    ];
    
    let isValidAccess = false;
    
    // Check if referrer is valid
    if (referrer) {
        for (let valid of validReferrers) {
            if (referrer.toLowerCase().includes(valid)) {
                isValidAccess = true;
                break;
            }
        }
    }
    
    // Also check for existing valid session
    const sessionData = localStorage.getItem('eventSession');
    if (sessionData) {
        try {
            const session = JSON.parse(sessionData);
            if (session.created && Date.now() - session.created < 300000) { // 5 minutes
                isValidAccess = true;
            }
        } catch (e) {
            // Invalid session data
        }
    }
    
    // Redirect to bypass if direct access detected
    if (!isValidAccess) {
        logSecurityEvent('Direct access to redirect page detected - Referrer: ' + (referrer || 'None'));
        localStorage.setItem('bypassReason', 'Direct access detected. Please use the proper verification process.');
        setTimeout(() => {
            window.location.href = 'bypass.html';
        }, 2000);
        return false;
    }
    
    logSecurityEvent('Valid access to redirect page - Referrer: ' + referrer);
    return true;
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
    console.log(`[SECURITY] 2025-08-08 10:02:07: ${event}`);
    
    // Store events for debugging
    const events = JSON.parse(localStorage.getItem('securityEvents') || '[]');
    events.push({
        timestamp: '2025-08-08 10:02:07',
        event: event,
        url: window.location.href
    });
    
    if (events.length > 20) {
        events.splice(0, events.length - 20);
    }
    
    localStorage.setItem('securityEvents', JSON.stringify(events));
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
            
            // Create session for validation
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
                this.style.transform = 'scale(0.98)';
                setTimeout(() => {
                    this.style.transform = '';
                    window.open(link, '_blank');
                }, 150);
            }
        });
    }
    
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
    
    securityState.attempts++;
    if (securityState.attempts > SECURITY_CONFIG.maxAttempts) {
        logSecurityEvent('Too many attempts - redirecting to bypass');
        localStorage.setItem('bypassReason', 'Too many failed verification attempts.');
        setTimeout(() => {
            window.location.href = 'bypass.html';
        }, 2000);
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
        expiryTime.textContent = '2025-08-09 10:02:07 UTC';
    }
    
    // Store successful validation
    const sessionData = JSON.parse(localStorage.getItem('eventSession') || '{}');
    sessionData.validated = true;
    sessionData.token = hashToken(token);
    sessionData.validatedAt = Date.now();
    localStorage.setItem('eventSession', JSON.stringify(sessionData));
    
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
            this.style.transform = 'scale(0.98)';
            setTimeout(() => {
                localStorage.clear();
                window.location.href = 'index.html';
            }, 150);
        });
    }
    
    if (contactSupportBtn) {
        contactSupportBtn.addEventListener('click', function() {
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
}

function updateSessionInfo() {
    const timestampEl = document.getElementById('timestamp');
    const userAgentEl = document.getElementById('userAgent');
    const sessionIdEl = document.getElementById('sessionId');
    const userLoginEl = document.getElementById('userLogin');
    
    if (timestampEl) {
        timestampEl.textContent = '2025-08-08 10:02:07 UTC';
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

// Update timestamps throughout the site
function updateTimestamps() {
    const utcString = '2025-08-08 10:02:07 UTC';
    
    const timestampElements = document.querySelectorAll('[id*="timestamp"], .timestamp');
    timestampElements.forEach(el => {
        if (el.textContent.includes('UTC') || el.textContent.includes('2025')) {
            el.textContent = utcString;
        }
    });
}

// Initialize security logging
logSecurityEvent('Security system initialized for user: SL1YYY');
