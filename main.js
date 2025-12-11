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

// --- DATA FETCHING & TRANSLATION ---

async function loadComponent(name) {
    try {
        const response = await fetch(`components/${name}.html?v=${new Date().getTime()}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const text = await response.text();
        const container = document.getElementById(`${name}-container`);
        if (container) {
            container.innerHTML = text;
        }
    } catch (error) {
        console.error(`Failed to load component ${name}:`, error);
        const container = document.getElementById(`${name}-container`);
        if(container) container.innerHTML = `<p style="color: red; text-align: center;" data-translate-key="load_component_error">Failed to load ${name}.</p>`;
    }
}

async function loadTranslations(lang) {
    if (translations[lang]) {
        return translations[lang];
    }
    try {
        const response = await fetch(`translations/${lang}.json?v=${new Date().getTime()}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        translations[lang] = data; // Cache the loaded translations
        return data;
    } catch (error) {
        console.error(`Error loading translations for ${lang}:`, error);
        return null;
    }
}

function applyTranslations(container = document) {
    const translatableElements = container.querySelectorAll('[data-translate-key], [data-translate-key-placeholder]');
    const currentTranslations = translations[currentLang];
    if (!currentTranslations) return;

    translatableElements.forEach(el => {
        const key = el.getAttribute('data-translate-key');
        const placeholderKey = el.getAttribute('data-translate-key-placeholder');

        if (key && currentTranslations[key]) {
            if (el.tagName === 'META') {
                el.setAttribute('content', currentTranslations[key]);
            } else {
                el.innerHTML = currentTranslations[key];
            }
        }

        if (placeholderKey && currentTranslations[placeholderKey]) {
            el.setAttribute('placeholder', currentTranslations[placeholderKey]);
        }
    });
}

// --- UI & STATE MANAGEMENT ---

async function setLanguage(lang, isInitial = false) {
    const newTranslations = await loadTranslations(lang);
    if (!newTranslations) return;

    currentLang = lang;
    document.documentElement.lang = lang;
    localStorage.setItem('language', lang);
    if (!isInitial) {
        updateURL(lang);
    }

    const langTextEl = document.getElementById('selected-lang-text');
    const langFlagEl = document.getElementById('selected-lang-flag');
    if (langTextEl) langTextEl.textContent = newTranslations.name;
    if (langFlagEl) langFlagEl.textContent = newTranslations.flag;

    applyTranslations();
}

function updateURL(lang) {
    const url = new URL(window.location);
    url.searchParams.set('lang', lang);
    // window.history.pushState({}, '', url);
}

// --- COMPONENT-SPECIFIC LOGIC ---

function initializeSecurityDemo() {
    const container = document.getElementById('security-container');
    if (!container) return;

    container.addEventListener('click', (event) => {
        const startBtn = event.target.closest('#start-decryption-btn');
        const resetBtn = event.target.closest('#reset-security-btn');
        if (!startBtn && !resetBtn) return;

        const lockedState = document.getElementById('sec-state-locked');
        const processingState = document.getElementById('sec-state-processing');
        const unlockedState = document.getElementById('sec-state-unlocked');
        const decryptionTextEl = document.getElementById('decryption-text');

        if (startBtn && lockedState && processingState && unlockedState && decryptionTextEl) {
            lockedState.classList.add('hidden');
            processingState.classList.remove('hidden');

            const originalText = translations[currentLang]?.['security_processing_title'] || 'Decrypting...';
            scrambleText(decryptionTextEl, originalText, 1500);

            setTimeout(() => {
                processingState.classList.add('hidden');
                unlockedState.classList.remove('hidden');
            }, 2000);
        }

        if (resetBtn && lockedState && unlockedState && decryptionTextEl) {
            unlockedState.classList.add('hidden');
            lockedState.classList.remove('hidden');
            decryptionTextEl.textContent = translations[currentLang]?.['security_processing_title'] || 'Decrypting...';
        }
    });

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
            if(element) element.textContent = scrambled;
            
            if (counter >= originalText.length) {
                clearInterval(interval);
                if(element) element.textContent = originalText;
            }
            counter += 1 / (duration / 1000 / originalText.length);
        }, 50);
    };
}

function handleDeepLink() {
    const hash = window.location.hash;
    if (hash) {
        setTimeout(() => {
            const targetElement = document.querySelector(hash);
            if (targetElement) {
                const header = document.querySelector('header');
                const headerOffset = header ? header.offsetHeight : 0;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
            }
        }, 300);
    }
}

function initializeArchitectureDiagram() {
    const section = document.getElementById('architecture');
    if (!section) return;

    const cards = section.querySelectorAll('.arch-card');
    const details = section.querySelectorAll('.arch-detail');
    const placeholder = section.querySelector('#arch-detail-placeholder');

    cards.forEach(card => {
        card.addEventListener('click', () => {
            const tech = card.dataset.tech;
            const detailPanel = section.querySelector(`#arch-detail-${tech}`);

            if (card.classList.contains('active')) {
                return;
            }

            cards.forEach(c => c.classList.remove('active'));
            details.forEach(d => d.classList.add('hidden'));

            card.classList.add('active');
            if(placeholder) placeholder.classList.add('hidden');
            if(detailPanel) detailPanel.classList.remove('hidden');
        });
    });
}

// --- EVENT LISTENERS INITIALIZATION ---

function initializeEventListeners() {
    document.getElementById('theme-toggle-btn')?.addEventListener('click', toggleTheme);
    
    const langSwitcherButton = document.getElementById('language-switcher-button');
    const langOptions = document.getElementById('language-options');
    langSwitcherButton?.addEventListener('click', (e) => {
        e.stopPropagation();
        langOptions.style.display = langOptions.style.display === 'block' ? 'none' : 'block';
    });
    document.addEventListener('click', (e) => {
        if (langOptions && langSwitcherButton && !langSwitcherButton.contains(e.target) && !langOptions.contains(e.target)) {
            langOptions.style.display = 'none';
        }
    });
    langOptions?.addEventListener('click', (e) => {
        const link = e.target.closest('a[data-lang]');
        if (link) {
            e.preventDefault();
            setLanguage(link.getAttribute('data-lang'));
            langOptions.style.display = 'none';
        }
    });

    document.getElementById('logo-link')?.addEventListener('click', function(e) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        document.getElementById('mobile-menu')?.classList.remove('is-open');
    });
    
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => mobileMenu.classList.toggle('is-open'));
        mobileMenu.addEventListener('click', (e) => {
            if (e.target.tagName === 'A') mobileMenu.classList.remove('is-open');
        });
    }

    document.addEventListener('click', function(e) {
        const anchor = e.target.closest('a[href^="#"]');
        if (!anchor) return;
        const targetId = anchor.getAttribute('href');
        if (targetId === '#' || !targetId) return;
        e.preventDefault();
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            const url = new URL(window.location);
            url.hash = targetId;
            // window.history.pushState({}, '', url);
            const header = document.querySelector('header');
            const headerOffset = header ? header.offsetHeight : 0;
            const elementPosition = targetElement.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            window.scrollTo({ top: offsetPosition, behavior: "smooth" });
        }
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('.fade-in-up').forEach(element => observer.observe(element));
}

// --- APP INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async () => {
    const components = [
        'header', 'hero', 'ecosystem', 'features', 'ai_assistant', 
        'architecture', 'security', 'audience', 'contact', 'footer', 'cta',
    ];

    try {
        initializeTheme();

        // 1. Load all HTML components into the DOM first.
        await Promise.all(components.map(loadComponent));

        // 2. Once all components are in the DOM, determine the language.
        const urlParams = new URLSearchParams(window.location.search);
        const langFromUrl = urlParams.get('lang');
        const savedLang = langFromUrl || localStorage.getItem('language') || 'uk';

        // 3. Load the translations and apply them to the entire document.
        await setLanguage(savedLang, true);
        
        // 4. Initialize all event listeners now that the page is fully built and translated.
        initializeEventListeners();
        initializeArchitectureDiagram();
        initializeSecurityDemo();
        handleDeepLink();
        
        // 5. Clean URL after page load and potential deep link scroll
        setTimeout(() => {
            const cleanUrl = window.location.origin + window.location.pathname;
            window.history.replaceState(null, '', cleanUrl);
        }, 1000); // Delay to allow for scrolling

    } catch (error) {
        console.error("App initialization failed:", error);
        document.body.innerHTML = '<div style="text-align: center; padding: 50px; font-family: sans-serif;" data-translate-key="app_init_error"><h1>Error</h1><p>Could not load page content. Please try again later.</p></div>';
    }
});