let currentLang = 'uk';

function setLanguage(lang) {
    if (translations[lang] && lang !== currentLang) {
        currentLang = lang;
        document.documentElement.lang = lang;
        localStorage.setItem('language', lang);

        const translatableElements = document.querySelectorAll('[data-translate-key]');
        
        // 1. Fade out all translatable elements
        translatableElements.forEach(el => {
            el.style.opacity = '0';
        });

        // 2. Wait for the fade-out transition to complete
        setTimeout(() => {
            // Update button text and flag immediately
            const { name, flag } = translations[lang];
            document.getElementById('selected-lang-text').textContent = name;
            document.getElementById('selected-lang-flag').textContent = flag;

            // 3. Update the content of all elements
            translatableElements.forEach(el => {
                const key = el.getAttribute('data-translate-key');
                if (translations[lang][key]) {
                    if (el.tagName === 'META') {
                        el.setAttribute('content', translations[lang][key]);
                    } else {
                        el.innerHTML = translations[lang][key];
                    }
                }
            });
            
            // Update dynamic content that is not part of the querySelectorAll loop
            const activeRole = document.getElementById('tab-admin').classList.contains('bg-white') ? 'admin' : 'student';
            document.getElementById('role-content').innerHTML = getRoleContent(activeRole);

            // 4. Fade in all translatable elements
            translatableElements.forEach(el => {
                el.style.opacity = '1';
            });
            document.getElementById('role-content').style.opacity = '1';

            // 5. Update charts with new language
            updateChartsAndTitles(lang);

        }, 200); // This duration should match the CSS transition time
    }
}

function updateChartsAndTitles(lang) {
    const group = document.getElementById('group-selector').value;
    const data = groupData[group];
    const kpiList = document.getElementById('kpi-list');

    if (kpiList) {
        kpiList.innerHTML = data.kpiKeys.map(key => `<li>✅ ${translations[lang][key]}</li>`).join('');
    }

    if (completionChartInstance) {
        completionChartInstance.options.plugins.title.text = translations[lang].admin_chart_completion_title;
        completionChartInstance.data.labels = Object.keys(data.completion).map(key => translations[lang][`chart_label_${key}`]);
        completionChartInstance.data.datasets[0].label = translations[lang].chart_dataset_completion;
        completionChartInstance.update('none'); // 'none' for no animation
    }
     if (chronoChartInstance) {
        chronoChartInstance.options.plugins.title.text = translations[lang].admin_chart_chrono_title;
        chronoChartInstance.data.datasets[0].label = translations[lang].chart_dataset_activity;
        chronoChartInstance.update('none');
    }
}


// --- Architecture Interaction ---
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

// --- Role Tabs Logic ---
function switchRole(role) {
    const adminBtn = document.getElementById('tab-admin');
    const studentBtn = document.getElementById('tab-student');
    
    if (role === 'admin') {
        adminBtn.className = "px-6 py-2 rounded-md text-sm font-medium bg-white text-brand-600 shadow-sm transition-all";
        studentBtn.className = "px-6 py-2 rounded-md text-sm font-medium text-slate-500 hover:text-slate-700 transition-all";
    } else {
        studentBtn.className = "px-6 py-2 rounded-md text-sm font-medium bg-white text-green-600 shadow-sm transition-all";
        adminBtn.className = "px-6 py-2 rounded-md text-sm font-medium text-slate-500 hover:text-slate-700 transition-all";
    }

    document.getElementById('role-content').innerHTML = getRoleContent(role);
}

function getRoleContent(role) {
    const lang = translations[currentLang];
    if (role === 'admin') {
        return `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
            <div>
                <h3 class="text-xl font-bold text-brand-600 mb-3" data-translate-key="roles_admin_intro">${lang.roles_admin_intro}</h3>
                <ul class="space-y-3">
                    <li class="flex items-start"><span class="mr-2">📝</span><span data-translate-key="roles_admin_item1">${lang.roles_admin_item1}</span></li>
                    <li class="flex items-start"><span class="mr-2">👥</span><span data-translate-key="roles_admin_item2">${lang.roles_admin_item2}</span></li>
                    <li class="flex items-start"><span class="mr-2">📊</span><span data-translate-key="roles_admin_item3">${lang.roles_admin_item3}</span></li>
                    <li class="flex items-start"><span class="mr-2">🔑</span><span data-translate-key="roles_admin_item4">${lang.roles_admin_item4}</span></li>
                    <li class="flex items-start"><span class="mr-2">📅</span><span data-translate-key="roles_admin_item5">${lang.roles_admin_item5}</span></li>
                </ul>
            </div>
            <div class="bg-slate-50 p-4 rounded-lg border border-slate-100 flex items-center justify-center">
                <div class="text-center">
                    <div class="text-4xl mb-2">🖥️</div>
                    <p class="font-bold text-slate-700">Flutter Web / JS Framework</p>
                    <p class="text-xs text-slate-500" data-translate-key="roles_admin_platform">${lang.roles_admin_platform}</p>
                </div>
            </div>
        </div>
    `;
    } else {
        return `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
            <div>
                <h3 class="text-xl font-bold text-green-600 mb-3" data-translate-key="roles_student_intro">${lang.roles_student_intro}</h3>
                <ul class="space-y-3">
                    <li class="flex items-start"><span class="mr-2">📱</span><span data-translate-key="roles_student_item1">${lang.roles_student_item1}</span></li>
                    <li class="flex items-start"><span class="mr-2">🎮</span><span data-translate-key="roles_student_item2">${lang.roles_student_item2}</span></li>
                    <li class="flex items-start"><span class="mr-2">💬</span><span data-translate-key="roles_student_item3">${lang.roles_student_item3}</span></li>
                    <li class="flex items-start"><span class="mr-2">⚙️</span><span data-translate-key="roles_student_item4">${lang.roles_student_item4}</span></li>
                    <li class="flex items-start"><span class="mr-2">🔒</span><span data-translate-key="roles_student_item5">${lang.roles_student_item5}</span></li>
                </ul>
            </div>
            <div class="bg-slate-50 p-4 rounded-lg border border-slate-100 flex items-center justify-center">
                <div class="text-center">
                    <div class="text-4xl mb-2">📱💻</div>
                    <p class="font-bold text-slate-700">Cross-Platform App</p>
                    <p class="text-xs text-slate-500" data-translate-key="roles_student_platform">${lang.roles_student_platform}</p>
                </div>
            </div>
        </div>
    `;
    }
}

// --- Analytics Charts (Chart.js) ---
let completionChartInstance = null;
let chronoChartInstance = null;

const groupData = {
    sales: {
        completion: { course1: 85, course2: 92, testA: 78, training: 60 },
        kpiKeys: ["kpi_sales1", "kpi_sales2", "kpi_sales3"],
        chronoData: [12, 45, 67, 40, 25, 60, 80]
    },
    dev: {
        completion: { course1: 95, course2: 88, testA: 90, training: 85 },
        kpiKeys: ["kpi_dev1", "kpi_dev2", "kpi_dev3"],
        chronoData: [5, 15, 30, 80, 70, 40, 20]
    },
    hr: {
        completion: { course1: 70, course2: 85, testA: 95, training: 90 },
        kpiKeys: ["kpi_hr1", "kpi_hr2", "kpi_hr3"],
        chronoData: [30, 35, 40, 45, 50, 55, 60]
    }
};

function initCharts() {
    const ctx1 = document.getElementById('completionChart').getContext('2d');
    completionChartInstance = new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: [], // To be filled by setLanguage
            datasets: [{
                label: '',
                data: [],
                backgroundColor: 'rgba(99, 102, 241, 0.7)',
                borderColor: 'rgb(99, 102, 241)',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, title: { display: true, text: '' } },
            scales: { y: { beginAtZero: true, max: 100 } }
        }
    });

    const ctx2 = document.getElementById('chronoChart').getContext('2d');
    chronoChartInstance = new Chart(ctx2, {
        type: 'line',
        data: {
            labels: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'],
            datasets: [{
                label: '',
                data: [],
                borderColor: 'rgb(249, 115, 22)',
                backgroundColor: 'rgba(249, 115, 22, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: true }, title: { display: true, text: '' } },
            scales: { y: { beginAtZero: true } }
        }
    });

    // Initial chart update
    updateCharts();
    // Set initial language without animations
    const savedLang = localStorage.getItem('language') || 'uk';
    setLanguageInitial(savedLang);
}

function updateCharts() {
    const group = document.getElementById('group-selector').value;
    updateChartsAndTitles(currentLang); 
}

function setLanguageInitial(lang) {
    currentLang = lang;
    document.documentElement.lang = lang;
    localStorage.setItem('language', lang);

    const { name, flag } = translations[lang];
    document.getElementById('selected-lang-text').textContent = name;
    document.getElementById('selected-lang-flag').textContent = flag;
    
    document.querySelectorAll('[data-translate-key]').forEach(el => {
        const key = el.getAttribute('data-translate-key');
        if (translations[lang][key]) {
            if (el.tagName === 'META') {
                el.setAttribute('content', translations[lang][key]);
            } else {
                el.innerHTML = translations[lang][key];
            }
        }
    });

    updateChartsAndTitles(lang);
    switchRole('admin');
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    
    initCharts();

    // Custom Language Switcher Logic
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

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!document.getElementById('language-switcher-container').contains(e.target)) {
            langOptions.classList.remove('show');
            langSwitcherButton.setAttribute('aria-expanded', 'false');
        }
    });

    document.getElementById('mobile-menu-btn').addEventListener('click', () => {
        document.getElementById('mobile-menu').classList.toggle('hidden');
    });

    // Scroll Animation Observer
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

    // Smooth Scrolling for nav links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
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
});