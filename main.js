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

    if (!isInitial) {
        const elements = document.querySelectorAll('[data-translate-key]');
        elements.forEach(el => el.classList.add('translating'));

        await new Promise(resolve => setTimeout(resolve, 250)); // Wait for fade-out
    }

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

    if (!isInitial) {
        const elements = document.querySelectorAll('[data-translate-key]');
        elements.forEach(el => el.classList.remove('translating'));
    }
}

function updateURL(lang) {
    const url = new URL(window.location);
    url.searchParams.set('lang', lang);
    // window.history.pushState({}, '', url);
}

// --- COMPONENT-SPECIFIC LOGIC ---

function initializeCookiePolicy() {
    const cookieBanner = document.getElementById('cookie-banner');
    const acceptButton = document.getElementById('accept-cookie-policy');

    if (!cookieBanner || !acceptButton) {
        console.error("Cookie banner or accept button not found.");
        return;
    }

    const consent = localStorage.getItem('cookieConsent');

    if (consent === 'accepted') {
        return;
    }

    setTimeout(() => {
        cookieBanner.classList.add('show');
    }, 500);

    acceptButton.addEventListener('click', () => {
        localStorage.setItem('cookieConsent', 'accepted');
        cookieBanner.classList.remove('show');
    });
}

function initializeCtaForm() {
    const ctaButtonContainer = document.getElementById('cta-button-container');
    const showContactFormBtn = document.getElementById('show-contact-form-btn');
    const contactFormContainer = document.getElementById('contact-form-container');
    const form = contactFormContainer?.querySelector('form');

    if (showContactFormBtn && contactFormContainer && ctaButtonContainer) {
        showContactFormBtn.addEventListener('click', () => {
            ctaButtonContainer.classList.add('hidden');
            contactFormContainer.classList.add('form-visible');
        });
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitButton = form.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.innerHTML;
            submitButton.disabled = true;
            submitButton.innerHTML = `<span data-translate-key="form_sending">Відправка...</span>`;
            applyTranslations(form); // Translate the new button text

            const formData = new FormData(form);
            const name = formData.get('name');
            const email = formData.get('email');
            const message = formData.get('message');

            try {
                await sendTelegramMessage(name, email, message);
                const formContent = contactFormContainer.querySelector('.form-content');
                formContent.innerHTML = `<div class="text-center p-8">
                    <h3 class="text-2xl font-bold text-green-600 dark:text-green-400" data-translate-key="form_success_title">Дякуємо!</h3>
                    <p class="mt-2 text-slate-700 dark:text-slate-300" data-translate-key="form_success_message">Ваше повідомлення було успішно надіслано. Ми зв'яжемося з вами найближчим часом.</p>
                </div>`;
                applyTranslations(contactFormContainer);
            } catch (error) {
                console.error('Telegram sending failed:', error);
                const formContent = contactFormContainer.querySelector('.form-content');
                formContent.innerHTML = `<div class="text-center p-8">
                    <h3 class="text-2xl font-bold text-red-600 dark:text-red-400" data-translate-key="form_error_title">Помилка</h3>
                    <p class="mt-2 text-slate-700 dark:text-slate-300" data-translate-key="form_error_message">Не вдалося надіслати повідомлення. Будь ласка, спробуйте ще раз пізніше.</p>
                </div>`;
                applyTranslations(contactFormContainer);
            }
        });
    }
}

async function sendTelegramMessage(name, email, message) {
    const botToken = 'YOUR_TELEGRAM_BOT_TOKEN'; // <-- IMPORTANT: Replace with your Bot Token
    const chatId = 'YOUR_TELEGRAM_CHAT_ID';   // <-- IMPORTANT: Replace with your Chat ID

    if (botToken === 'YOUR_TELEGRAM_BOT_TOKEN' || chatId === 'YOUR_TELEGRAM_CHAT_ID') {
        console.warn('Telegram bot token or chat ID is not configured.');
        // In a real scenario, you might want to throw an error or handle this case differently.
        // For this demo, we'll simulate a success without sending the message.
        return Promise.resolve(); 
    }

    const text = `
        ✨ *Нова заявка з сайту Next Level!* ✨
        -----------------------------------
        👤 *Ім'я:* ${name}
        📧 *Email:* ${email}
        
        💬 *Повідомлення:*
        ${message}
        -----------------------------------
    `;

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            chat_id: chatId,
            text: text,
            parse_mode: 'Markdown',
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Telegram API Error: ${errorData.description}`);
    }

    return response.json();
}

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

    const setupArchitectureGroup = (cardGroupId) => {
        const cardGroup = document.getElementById(cardGroupId);
        if (!cardGroup) return;

        const cards = cardGroup.querySelectorAll('.arch-card');
        const detailContainer = cardGroup.nextElementSibling;
        const details = detailContainer.querySelectorAll('.arch-detail');
        const placeholder = detailContainer.querySelector('.arch-detail-placeholder');

        cardGroup.addEventListener('click', (e) => {
            const card = e.target.closest('.arch-card');
            if (!card) return;

            const tech = card.dataset.tech;
            const targetDetail = detailContainer.querySelector(`.arch-detail[data-tech='${tech}']`);
            
            if (card.classList.contains('active')) {
                return;
            }

            cards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');

            if (placeholder) placeholder.classList.add('hidden-placeholder');

            details.forEach(detail => {
                if (detail === targetDetail) {
                    detail.classList.add('active');
                } else {
                    detail.classList.remove('active');
                }
            });
        });
    };

    setupArchitectureGroup('arch-frontend-cards');
    setupArchitectureGroup('arch-backend-cards');
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

    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const menuIconOpen = document.getElementById('menu-icon-open');
    const menuIconClose = document.getElementById('menu-icon-close');

    const toggleMenu = () => {
        const isOpen = mobileMenu.classList.toggle('is-open');
        mobileMenuBtn.setAttribute('aria-expanded', isOpen);
        if (menuIconOpen && menuIconClose) {
            menuIconOpen.classList.toggle('hidden', isOpen);
            menuIconOpen.classList.toggle('block', !isOpen);
            menuIconClose.classList.toggle('hidden', !isOpen);
            menuIconClose.classList.toggle('block', isOpen);
        }
    };

    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', toggleMenu);

        mobileMenu.addEventListener('click', (e) => {
            if (e.target.closest('a')) {
                toggleMenu();
            }
        });
    }

    document.getElementById('logo-link')?.addEventListener('click', function(e) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (mobileMenu?.classList.contains('is-open')) {
            toggleMenu();
        }
    });

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
        'architecture', 'security', 'audience', 'footer', 'cta', 'cookie-policy'
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
        initializeCookiePolicy();
        initializeCtaForm();
        handleDeepLink();
        
        // 5. Reveal the main content
        document.querySelector('main')?.classList.add('loaded');

        // 6. Clean URL after page load and potential deep link scroll
        setTimeout(() => {
            const cleanUrl = window.location.origin + window.location.pathname;
            window.history.replaceState(null, '', cleanUrl);
        }, 1000); // Delay to allow for scrolling

    } catch (error) {
        console.error("App initialization failed:", error);
        document.body.innerHTML = '<div style="text-align: center; padding: 50px; font-family: sans-serif;" data-translate-key="app_init_error"><h1>Error</h1><p>Could not load page content. Please try again later.</p></div>';
    }
});
