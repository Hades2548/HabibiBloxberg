// Modern JavaScript with improved error handling and performance
'use strict';

// Configuration
const CONFIG = {
    DISCORD_USER_ID: '1392241202866290718',
    LANYARD_API_URL: 'https://api.lanyard.rest/v1/users/',
    UPDATE_INTERVAL: 30000, // 30 seconds
    ANIMATION_DURATION: 300,
    CACHE_DURATION: 60000, // 1 minute
    THEME_KEY: 'habibibloxberg-theme',
    VISITOR_KEY: 'habibibloxberg-visitors',
    SESSION_KEY: 'habibibloxberg-session'
};

// State Management
const state = {
    currentPage: 'home',
    theme: 'dark',
    discordData: null,
    lastFetch: 0,
    updateInterval: null
};

// Utility Functions
const utils = {
    // Debounce function for performance
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // Safe localStorage access
    storage: {
        get(key) {
            try {
                return localStorage.getItem(key);
            } catch (e) {
                console.error('localStorage read error:', e);
                return null;
            }
        },
        
        set(key, value) {
            try {
                localStorage.setItem(key, value);
                return true;
            } catch (e) {
                console.error('localStorage write error:', e);
                return false;
            }
        },
        
        getJSON(key) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : null;
            } catch (e) {
                console.error('localStorage JSON parse error:', e);
                return null;
            }
        },
        
        setJSON(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (e) {
                console.error('localStorage JSON write error:', e);
                return false;
            }
        }
    },
    
    // Animated counter
    animateCounter(element, targetValue, duration = 2000) {
        const startTime = performance.now();
        const startValue = parseInt(element.textContent) || 0;
        
        const updateCounter = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const currentValue = Math.floor(startValue + (targetValue - startValue) * easeOutQuart);
            
            element.textContent = currentValue;
            
            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            }
        };
        
        requestAnimationFrame(updateCounter);
    }
};

// Theme Manager
const themeManager = {
    init() {
        const savedTheme = utils.storage.get(CONFIG.THEME_KEY) || 'dark';
        this.setTheme(savedTheme);
        
        const toggle = document.querySelector('.theme-toggle');
        if (toggle) {
            toggle.addEventListener('click', () => this.toggleTheme());
        }
    },
    
    setTheme(theme) {
        state.theme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        utils.storage.set(CONFIG.THEME_KEY, theme);
        
        const toggle = document.querySelector('.theme-toggle i');
        if (toggle) {
            toggle.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    },
    
    toggleTheme() {
        const newTheme = state.theme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }
};

// Discord Integration with improved error handling
const discordIntegration = {
    async fetchDiscordData() {
        const now = Date.now();
        
        // Check cache
        if (state.discordData && (now - state.lastFetch) < CONFIG.CACHE_DURATION) {
            return state.discordData;
        }
        
        try {
            const response = await fetch(`${CONFIG.LANYARD_API_URL}${CONFIG.DISCORD_USER_ID}`, {
                signal: AbortSignal.timeout(5000) // 5 second timeout
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success && data.data) {
                state.discordData = data.data;
                state.lastFetch = now;
                this.updateDiscordDisplay(data.data);
                return data.data;
            } else {
                throw new Error('Invalid response from Lanyard API');
            }
        } catch (error) {
            console.error('Discord fetch error:', error);
            this.showError();
            return null;
        }
    },
    
    updateDiscordDisplay(userData) {
        const elements = {
            username: document.getElementById('discord-username'),
            statusText: document.getElementById('status-text'),
            avatar: document.getElementById('discord-avatar'),
            statusIndicator: document.getElementById('status-indicator'),
            badges: document.getElementById('discord-badges'),
            statusLine: document.querySelector('.discord-status-line')
        };
        
        // Update username
        if (elements.username) {
            const displayName = userData.discord_user?.global_name || 
                               userData.discord_user?.username || 
                               'Habibi';
            elements.username.textContent = displayName;
            elements.username.parentElement.style.display = 'flex';
        }
        
        // Update avatar with proper error handling
        if (elements.avatar && userData.discord_user) {
            const { id, avatar } = userData.discord_user;
            if (avatar) {
                const isAnimated = avatar.startsWith('a_');
                const extension = isAnimated ? 'gif' : 'webp';
                const avatarUrl = `https://cdn.discordapp.com/avatars/${id}/${avatar}.${extension}?size=128`;
                
                elements.avatar.src = avatarUrl;
                elements.avatar.alt = `${userData.discord_user.username}'s avatar`;
                elements.avatar.style.display = 'block';
                
                // Remove skeleton loader
                const skeleton = elements.avatar.parentElement.querySelector('.avatar-skeleton');
                if (skeleton) skeleton.remove();
            }
        }
        
        // Update status with activity
        if (elements.statusText) {
            const status = this.getStatusMessage(userData);
            elements.statusText.textContent = status;
            elements.statusText.style.display = 'block';
            
            // Remove skeleton loader
            const skeleton = elements.statusText.parentElement.querySelector('.status-skeleton');
            if (skeleton) skeleton.remove();
        }
        
        // Update status indicator
        if (elements.statusIndicator) {
            const statusClass = userData.discord_status || 'offline';
            elements.statusIndicator.className = `status-indicator ${statusClass}`;
            elements.statusIndicator.setAttribute('aria-label', `Status: ${statusClass}`);
        }
        
        // Update badges
        if (elements.badges) {
            this.updateBadges(userData.discord_user);
        }
        
        // Update status line
        if (elements.statusLine) {
            this.updateStatusLine(userData, elements.statusLine);
        }
    },
    
    updateStatusLine(userData, statusLineElement) {
        const status = userData.discord_status;
        const statusEmoji = statusLineElement.querySelector('.status-emoji');
        const statusMessage = statusLineElement.querySelector('.status-message');
        
        if (!statusEmoji || !statusMessage) return;
        
        // Update emoji based on status
        const emojiMap = {
            online: '🟢',
            idle: '🌙',
            dnd: '🔴',
            offline: '⚫'
        };
        
        statusEmoji.textContent = emojiMap[status] || '⚫';
        
        // Build status message
        let message = '';
        switch(status) {
            case 'online':
                message = 'Online';
                break;
            case 'idle':
                message = 'Away';
                break;
            case 'dnd':
                message = 'Do Not Disturb';
                break;
            case 'offline':
            default:
                message = 'Offline';
                break;
        }
        
        // Add activity if available
        if (userData.activities && userData.activities.length > 0) {
            const activity = userData.activities[0];
            const activityTypes = {
                0: 'Playing',
                1: 'Streaming',
                2: 'Listening to',
                3: 'Watching',
                4: '' // Custom status
            };
            
            const prefix = activityTypes[activity.type];
            const name = activity.state || activity.name;
            
            if (prefix && name) {
                message += ` • ${prefix} ${name}`;
            } else if (name) {
                message += ` • ${name}`;
            }
        }
        
        statusMessage.textContent = message;
    },
    
    getStatusMessage(userData) {
        const statusMap = {
            online: '🟢 Online',
            idle: '🟡 Away',
            dnd: '🔴 Do Not Disturb',
            offline: '⚫ Offline'
        };
        
        let message = statusMap[userData.discord_status] || '⚫ Offline';
        
        // Add activity if available
        if (userData.activities && userData.activities.length > 0) {
            const activity = userData.activities[0];
            const activityTypes = {
                0: 'Playing',
                1: 'Streaming',
                2: 'Listening to',
                3: 'Watching',
                4: '' // Custom status
            };
            
            const prefix = activityTypes[activity.type];
            const name = activity.state || activity.name;
            
            if (prefix && name) {
                message += ` • ${prefix} ${name}`;
            } else if (name) {
                message += ` • ${name}`;
            }
        }
        
        return message;
    },
    
    updateBadges(discordUser) {
        const badgesContainer = document.getElementById('discord-badges');
        if (!badgesContainer) return;
        
        badgesContainer.innerHTML = '';
        
        // Badge definitions with emojis
        const badges = [];
        
        if (discordUser?.public_flags) {
            const flags = discordUser.public_flags;
            
            const flagMap = {
                1: { name: 'Discord Employee', emoji: '💼' },
                2: { name: 'Partnered Server Owner', emoji: '🤝' },
                4: { name: 'HypeSquad Events', emoji: '🎉' },
                8: { name: 'Bug Hunter Level 1', emoji: '🐛' },
                64: { name: 'HypeSquad Bravery', emoji: '💜' },
                128: { name: 'HypeSquad Brilliance', emoji: '🧡' },
                256: { name: 'HypeSquad Balance', emoji: '💚' },
                512: { name: 'Early Supporter', emoji: '⭐' },
                16384: { name: 'Bug Hunter Level 2', emoji: '🔍' },
                131072: { name: 'Verified Bot Developer', emoji: '🔧' },
                4194304: { name: 'Active Developer', emoji: '💻' }
            };
            
            for (const [flag, badge] of Object.entries(flagMap)) {
                if (flags & parseInt(flag)) {
                    badges.push(badge);
                }
            }
        }
        
        // Premium badges
        if (discordUser?.premium_type) {
            const premiumTypes = {
                1: { name: 'Nitro Classic', emoji: '💎' },
                2: { name: 'Nitro', emoji: '💎' },
                3: { name: 'Nitro Basic', emoji: '💙' }
            };
            
            const premium = premiumTypes[discordUser.premium_type];
            if (premium) badges.push(premium);
        }
        
        // Display badges
        badges.forEach(badge => {
            const badgeElement = document.createElement('span');
            badgeElement.className = 'badge';
            badgeElement.setAttribute('role', 'listitem');
            badgeElement.setAttribute('title', badge.name);
            badgeElement.textContent = badge.emoji;
            badgesContainer.appendChild(badgeElement);
        });
        
        // Default badge if no badges
        if (badges.length === 0) {
            const defaultBadge = document.createElement('span');
            defaultBadge.className = 'badge';
            defaultBadge.setAttribute('role', 'listitem');
            defaultBadge.textContent = '👤 Discord User';
            badgesContainer.appendChild(defaultBadge);
        }
    },
    
    showError() {
        const elements = {
            username: document.getElementById('discord-username'),
            statusText: document.getElementById('status-text')
        };
        
        if (elements.username) {
            elements.username.textContent = 'Habibi';
            elements.username.parentElement.style.display = 'flex';
        }
        
        if (elements.statusText) {
            elements.statusText.innerHTML = '⚠️ <a href="https://discord.gg/lanyard" target="_blank" rel="noopener">Join Lanyard for Live Status</a>';
        }
    },
    
    startAutoUpdate() {
        // Initial fetch
        this.fetchDiscordData();
        
        // Set up interval
        if (state.updateInterval) {
            clearInterval(state.updateInterval);
        }
        
        state.updateInterval = setInterval(() => {
            this.fetchDiscordData();
        }, CONFIG.UPDATE_INTERVAL);
    },
    
    stopAutoUpdate() {
        if (state.updateInterval) {
            clearInterval(state.updateInterval);
            state.updateInterval = null;
        }
    }
};

// Visitor Counter
const visitorCounter = {
    init() {
        // Get current visitor count with base value of 53
        let count = parseInt(utils.storage.get(CONFIG.VISITOR_KEY) || '53');
        
        // Check if this is a new visitor (no session ID)
        const sessionId = sessionStorage.getItem(CONFIG.SESSION_KEY);
        
        if (!sessionId) {
            // New visitor - increment count
            count++;
            utils.storage.set(CONFIG.VISITOR_KEY, count.toString());
            
            // Set session ID to prevent counting again in this session
            const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            sessionStorage.setItem(CONFIG.SESSION_KEY, newSessionId);
        }
        
        this.updateDisplay(count);
    },
    
    updateDisplay(count) {
        const element = document.getElementById('visitor-count');
        
        if (element) {
            // If count is less than 53, start with 53
            const displayCount = count < 53 ? 53 : count;
            utils.animateCounter(element, displayCount);
        }
    }
};

// Navigation System
const navigation = {
    init() {
        // Handle navigation clicks
        document.addEventListener('click', (e) => {
            const link = e.target.closest('[data-page]');
            if (link) {
                e.preventDefault();
                const targetPage = link.getAttribute('data-page');
                this.navigateTo(targetPage);
            }
            
            // Handle social links
            const socialLink = e.target.closest('#discord-link, #telegram-link');
            if (socialLink) {
                e.preventDefault();
                this.handleSocialClick(socialLink);
            }
        });
        
        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.page) {
                this.navigateTo(e.state.page, false);
            }
        });
    },
    
    navigateTo(page, updateHistory = true) {
        if (state.currentPage === page) return;
        
        const pages = {
            home: 'homepage-content',
            about: 'about-content',
            projects: 'projects-content'
        };
        
        const currentElement = document.getElementById(pages[state.currentPage]);
        const targetElement = document.getElementById(pages[page]);
        
        if (!currentElement || !targetElement) return;
        
        // Update history
        if (updateHistory) {
            history.pushState({ page }, '', `#${page}`);
        }
        
        // Transition pages
        currentElement.classList.remove('active');
        
        setTimeout(() => {
            targetElement.classList.add('active');
            state.currentPage = page;
            
            // Update focus for accessibility
            const focusTarget = targetElement.querySelector('h1, h2, [tabindex="0"]');
            if (focusTarget) {
                focusTarget.focus();
            }
        }, CONFIG.ANIMATION_DURATION);
    },
    
    async handleSocialClick(link) {
        const platform = link.id === 'discord-link' ? 'discord' : 'telegram';
        const text = platform === 'discord' ? 'habibibloxberg' : 't.me/habibibloxberg';
        
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                this.showCopyStatus(platform);
            } else {
                // Fallback for older browsers
                this.fallbackCopy(text, platform);
            }
        } catch (err) {
            console.error('Copy failed:', err);
            this.fallbackCopy(text, platform);
        }
    },
    
    fallbackCopy(text, platform) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        
        try {
            document.execCommand('copy');
            this.showCopyStatus(platform);
        } catch (err) {
            console.error('Fallback copy failed:', err);
        }
        
        document.body.removeChild(textArea);
    },
    
    showCopyStatus(platform) {
        const status = document.getElementById('copy-status');
        const message = document.getElementById('copy-message');
        
        if (status && message) {
            message.textContent = platform === 'discord' 
                ? 'Discord username copied!' 
                : 'Telegram link copied!';
            
            status.classList.add('show');
            
            setTimeout(() => {
                status.classList.remove('show');
            }, 3000);
        }
    }
};

// Vapour Text Morphing Effect
const vapourTextEffect = {
    words: ['Habibibloxberg', 'Developer', 'Creator', 'Coder', 'Designer'],
    currentIndex: 0,
    interval: null,
    
    init() {
        const vapourWord = document.querySelector('.vapour-word');
        if (!vapourWord) return;
        
        // Create the morphing effect
        this.interval = setInterval(() => {
            this.morphText(vapourWord);
        }, 2000); // Change text every 2 seconds
    },
    
    morphText(element) {
        // Update to next word
        this.currentIndex = (this.currentIndex + 1) % this.words.length;
        const nextWord = this.words[this.currentIndex];
        
        // Add morphing class
        element.style.opacity = '0.3';
        element.style.filter = 'blur(2px)';
        element.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            element.textContent = nextWord;
            element.style.opacity = '1';
            element.style.filter = 'blur(0px)';
            element.style.transform = 'scale(1)';
        }, 300);
    },
    
    destroy() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }
};

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize all modules
    themeManager.init();
    visitorCounter.init();
    navigation.init();
    discordIntegration.startAutoUpdate();
    vapourTextEffect.init();
    
    // Initialize spiral animation
    if (typeof initSpiralBackground === 'function') {
        initSpiralBackground();
    }
    
    // Handle initial page from URL
    const hash = window.location.hash.slice(1);
    if (hash && ['home', 'about', 'projects'].includes(hash)) {
        navigation.navigateTo(hash, false);
    }
});

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    discordIntegration.stopAutoUpdate();
    vapourTextEffect.destroy();
});

// Service Worker for offline support (optional)
if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
    navigator.serviceWorker.register('/sw.js').catch(() => {
        // Service worker registration failed, app will still work
    });
}