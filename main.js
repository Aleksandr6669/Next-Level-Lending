let currentLang = 'uk';
let translations = {}; // Cache for loaded translations

// --- THEME MANAGEMENT ---

function applyTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
}

function toggleTheme() {
    const newTheme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
    applyTheme(newTheme);
}

function initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    applyTheme(initialTheme);
}

// --- DATA FETCHING ---

async function loadComponent(name) {
    try {
        const response = await fetch(`components/${name}.html`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const text = await response.text();
        const container = document.getElementById(`${name}-container`);
        if (container) container.innerHTML = text;
    } catch (error) {
        const container = document.getElementById(`${name}-container`);
        if(container) container.innerHTML = `<p style="color: red; text-align: center;">Failed to load ${name}.</p>`;
    }
}

async function loadTranslations(lang) {
    if (translations[lang]) {
        return translations[lang];
    }
    try {
        const response = await fetch(`translations/${lang}.json`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        translations[lang] = data; 
        return data;
    } catch (error) {
        return null;
    }
}

// --- UI & STATE MANAGEMENT ---

async function setLanguage(lang, isInitial = false) {
    const newTranslations = await loadTranslations(lang);
    if (!newTranslations) return;

    currentLang = lang;
    document.documentElement.lang = lang;
    localStorage.setItem('language', lang);
    updateURL(lang, isInitial);

    const translatableElements = document.querySelectorAll('[data-translate-key]');

    if (!isInitial) {
        translatableElements.forEach(el => { el.style.opacity = '0'; });
    }

    setTimeout(() => {
        const langTextEl = document.getElementById('selected-lang-text');
        const langFlagEl = document.getElementById('selected-lang-flag');
        if (langTextEl) langTextEl.textContent = newTranslations.name;
        if (langFlagEl) langFlagEl.textContent = newTranslations.flag;

        translatableElements.forEach(el => {
            const key = el.getAttribute('data-translate-key');
            if (newTranslations[key]) {
                if (el.tagName === 'META') {
                    el.setAttribute('content', newTranslations[key]);
                } else if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
                    el.placeholder = newTranslations[key];
                } else {
                    el.innerHTML = newTranslations[key];
                }
            }
        });
        
        updateContactPlaceholder();

        if (!isInitial) {
            translatableElements.forEach(el => { el.style.opacity = '1'; });
        }
    }, isInitial ? 0 : 200);
}

function updateURL(lang, replace = false) {
    const url = new URL(window.location);
    url.searchParams.set('lang', lang);
    if (replace) {
        window.history.replaceState({}, '', url);
    } else {
        window.history.pushState({}, '', url);
    }
}

// --- COMPONENT-SPECIFIC LOGIC ---

function updateContactPlaceholder() {
    const roleSelector = document.getElementById('role-select');
    const messageTextarea = document.getElementById('message');
    const currentTranslations = translations[currentLang];

    if (!roleSelector || !messageTextarea || !currentTranslations) return;

    const selectedRole = roleSelector.value;
    const placeholderKeys = {
        student: 'contact_placeholder_student',
        teacher: 'contact_placeholder_teacher',
        business: 'contact_placeholder_business'
    };
    
    const placeholderText = currentTranslations[placeholderKeys[selectedRole]] || '';
    messageTextarea.placeholder = placeholderText;
}

// --- NEW SECURITY DEMO LOGIC ---

function initializeSecurityDemo() {
    const lockedState = document.getElementById('sec-state-locked');
    const processingState = document.getElementById('sec-state-processing');
    const unlockedState = document.getElementById('sec-state-unlocked');
    const startBtn = document.getElementById('start-decryption-btn');
    const resetBtn = document.getElementById('reset-security-btn');
    const decryptionTextEl = document.getElementById('decryption-text');

    if (!startBtn || !resetBtn) return;

    const scrambleText = (element, originalText, duration = 2000) => {
        let interval;
        let counter = 0;
        const chars = '!<>-_\\/[]{}—=+*^?#________';

        interval = setInterval(() => {
            let scrambled = '';
            for (let i = 0; i < originalText.length; i++) {
                if (i < counter) {
                    scrambled += originalText[i];
                } else {
                    scrambled += chars[Math.floor(Math.random() * chars.length)];
                }
            }
            element.textContent = scrambled;
            
            if (counter >= originalText.length) {
                clearInterval(interval);
                element.textContent = originalText;
            }
            counter += 1 / (duration / 1000 / originalText.length);
        }, 50);
    };

    startBtn.addEventListener('click', () => {
        lockedState.classList.add('is-hidden');
        processingState.classList.remove('is-hidden');

        const originalText = translations[currentLang]['security_processing_title'] || 'Розшифровка...';
        scrambleText(decryptionTextEl, originalText, 1500);

        setTimeout(() => {
            processingState.classList.add('is-hidden');
            unlockedState.classList.remove('is-hidden');
        }, 2000); 
    });

    resetBtn.addEventListener('click', () => {
        unlockedState.classList.add('is-hidden');
        lockedState.classList.remove('is-hidden');
        // Reset the text for next time
        decryptionTextEl.textContent = translations[currentLang]['security_processing_title'] || 'Розшифровка...';
    });
}

// --- APP INITIALIZATION ---

function initializeEventListeners() {
    // Theme switcher
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    }

    const langSwitcherButton = document.getElementById('language-switcher-button');
    const langOptions = document.getElementById('language-options');

    if (langSwitcherButton && langOptions) {
        langSwitcherButton.addEventListener('click', (e) => {
            e.stopPropagation();
            langOptions.classList.toggle('show');
            langSwitcherButton.setAttribute('aria-expanded', langOptions.classList.contains('show'));
        });

        langOptions.addEventListener('click', (e) => {
            const link = e.target.closest('a[data-lang]');
            if (link) {
                e.preventDefault();
                setLanguage(link.getAttribute('data-lang'));
                langOptions.classList.remove('show');
                langSwitcherButton.setAttribute('aria-expanded', 'false');
            }
        });
    }

    document.addEventListener('click', (e) => {
        const container = document.getElementById('language-switcher-container');
        if (container && !container.contains(e.target) && langOptions) {
            langOptions.classList.remove('show');
            if (langSwitcherButton) langSwitcherButton.setAttribute('aria-expanded', 'false');
        }
    });
    
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    if(mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));
    }

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#' || !targetId) return;

            e.preventDefault();
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                const url = new URL(window.location);
                url.hash = targetId;
                window.history.pushState({}, '', url);

                const header = document.querySelector('header');
                const headerOffset = header ? header.offsetHeight : 0;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({ top: offsetPosition, behavior: "smooth" });
            }
        });
    });

    const roleSelector = document.getElementById('role-select');
    if (roleSelector) {
        roleSelector.addEventListener('change', updateContactPlaceholder);
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-in-up').forEach(element => observer.observe(element));
    
    // Initialize the security demo after components are loaded
    initializeSecurityDemo();
}

document.addEventListener('DOMContentLoaded', async () => {
    const components = [
        'header', 'hero', 'ecosystem', 'features', 'ai_assistant', 
        'architecture', 'security', 'audience', 'contact', 'footer', 'cta'
    ];

    try {
        initializeTheme(); // Initialize theme first
        await Promise.all(components.map(loadComponent));
        const urlParams = new URLSearchParams(window.location.search);
        const langFromUrl = urlParams.get('lang');
        const savedLang = langFromUrl || localStorage.getItem('language') || 'uk';
        await setLanguage(savedLang, true);
        initializeEventListeners();
    } catch (error) {
        document.body.innerHTML = '<div style="text-align: center; padding: 50px; font-family: sans-serif;"><h1>Error</h1><p>Could not load page content. Please try again later.</p></div>';
    }
});