let currentLang = 'uk';
let updateContactPlaceholder;

function setLanguage(lang, isInitial = false) {
    if (translations[lang]) {
        currentLang = lang;
        document.documentElement.lang = lang;
        localStorage.setItem('language', lang);
        updateURL(lang, isInitial);

        const translatableElements = document.querySelectorAll('[data-translate-key]');
        
        if (!isInitial) {
            translatableElements.forEach(el => {
                el.style.opacity = '0';
            });
        }

        setTimeout(() => {
            const { name, flag } = translations[lang];
            document.getElementById('selected-lang-text').textContent = name;
            document.getElementById('selected-lang-flag').textContent = flag;

            translatableElements.forEach(el => {
                const key = el.getAttribute('data-translate-key');
                if (translations[lang][key]) {
                    if (el.tagName === 'META') {
                        el.setAttribute('content', translations[lang][key]);
                    } else if (el.tagName === 'TEXTAREA') {
                        el.placeholder = translations[lang][key];
                    } else {
                        el.innerHTML = translations[lang][key];
                    }
                }
            });

            if (updateContactPlaceholder) {
                updateContactPlaceholder();
            }
            
            if (!isInitial) {
                translatableElements.forEach(el => {
                    el.style.opacity = '1';
                });
            }

        }, isInitial ? 0 : 200);
    }
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

const archData = {
    client: {
        titleKey: "arch_client_tech_title",
        descKey: "arch_client_tech_desc"
    },
    backend: {
        titleKey: "arch_backend_tech_title",
        descKey: "arch_backend_tech_desc"
    }
};

function updateArchDetail(key) {
    const titleEl = document.getElementById('arch-title-display');
    const descEl = document.getElementById('arch-desc-display');
    const box = document.getElementById('arch-detail-box');
    
    box.classList.remove('opacity-100');
    box.classList.add('opacity-50');
    
    setTimeout(() => {
        titleEl.textContent = translations[currentLang][archData[key].titleKey];
        descEl.textContent = translations[currentLang][archData[key].descKey];
        box.classList.remove('opacity-50');
        box.classList.add('opacity-100');
    }, 150);
}

function startDecryption() {
    const locked = document.getElementById('sec-state-locked');
    const processing = document.getElementById('sec-state-processing');
    const unlocked = document.getElementById('sec-state-unlocked');
    const step1 = document.getElementById('step-1');
    const step2 = document.getElementById('step-2');
    const step3 = document.getElementById('step-3');

    locked.style.transform = 'translateY(-100%)';
    processing.style.transform = 'translateY(0)';
    step1.style.opacity = '0.5';
    step2.style.opacity = '1';

    setTimeout(() => {
        processing.style.transform = 'translateY(-100%)';
        unlocked.style.transform = 'translateY(0)';
        step2.style.opacity = '0.5';
        step3.style.opacity = '1';
    }, 2500);
}

function resetSecurity() {
    const locked = document.getElementById('sec-state-locked');
    const processing = document.getElementById('sec-state-processing');
    const unlocked = document.getElementById('sec-state-unlocked');
    const step1 = document.getElementById('step-1');
    const step2 = document.getElementById('step-2');
    const step3 = document.getElementById('step-3');

    unlocked.style.transform = 'translateY(100%)';
    processing.style.transform = 'translateY(100%)';
    locked.style.transform = 'translateY(0)';
    
    step1.style.opacity = '1';
    step2.style.opacity = '0.5';
    step3.style.opacity = '0.5';
}

document.addEventListener('DOMContentLoaded', () => {
    
    const urlParams = new URLSearchParams(window.location.search);
    const langFromUrl = urlParams.get('lang');
    const savedLang = langFromUrl || localStorage.getItem('language') || 'uk';

    setLanguage(savedLang, true);

    const langSwitcherButton = document.getElementById('language-switcher-button');
    const langOptions = document.getElementById('language-options');

    langSwitcherButton.addEventListener('click', (e) => {
        e.stopPropagation();
        langOptions.classList.toggle('show');
        const isExpanded = langOptions.classList.contains('show');
        langSwitcherButton.setAttribute('aria-expanded', isExpanded);
    });

    langOptions.addEventListener('click', (e) => {
        if (e.target.closest('a')) {
            e.preventDefault();
            const lang = e.target.closest('a').getAttribute('data-lang');
            setLanguage(lang);
            langOptions.classList.remove('show');
            langSwitcherButton.setAttribute('aria-expanded', 'false');
        }
    });

    document.addEventListener('click', (e) => {
        if (!document.getElementById('language-switcher-container').contains(e.target)) {
            langOptions.classList.remove('show');
            langSwitcherButton.setAttribute('aria-expanded', 'false');
        }
    });

    document.getElementById('mobile-menu-btn').addEventListener('click', () => {
        document.getElementById('mobile-menu').classList.toggle('hidden');
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-in-up').forEach(element => {
        observer.observe(element);
    });

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                const url = new URL(window.location);
                url.hash = targetId;
                window.history.pushState({}, '', url);

                const headerOffset = document.querySelector('header').offsetHeight;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        });
    });

    // Contact Form Logic
    const roleSelector = document.getElementById('role-selector');
    const messageTextarea = document.getElementById('message');

    updateContactPlaceholder = () => {
        if (!roleSelector || !messageTextarea) return;
        const selectedRole = roleSelector.value;
        let placeholderKey = 'contact_placeholder_student'; // Default
        if (selectedRole === 'teacher') {
            placeholderKey = 'contact_placeholder_teacher';
        } else if (selectedRole === 'business') {
            placeholderKey = 'contact_placeholder_business';
        }
        messageTextarea.placeholder = translations[currentLang][placeholderKey] || '';
    };

    if (roleSelector) {
        roleSelector.addEventListener('change', updateContactPlaceholder);
        updateContactPlaceholder(); // Initial set
    }
});
