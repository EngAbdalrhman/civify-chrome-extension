const translations = {
    en: {
        appTitle: "Civify",
        appSubtitle: "Tailor your resume instantly",
        apiKeyLabel: "API Key",
        apiKeyPlaceholder: "Enter your Civify API Key",
        loginBtn: "Login",
        getKeyLink: "Get one here",
        dontHaveKey: "Don't have a key?",
        logoutTitle: "Logout",
        tabMask: "Mask CV",
        tabTailor: "Tailor CV",
        dragDropMask: "Drag & Drop Resume (PDF)",
        dragDropTailor: "Upload Resume (PDF)",
        browse: "Browse",
        maskBtn: "Mask PII & Download",
        jdLabel: "Job Description",
        scrapeBtn: "Generate from LinkedIn",
        jdPlaceholder: "Paste job description or use 'Generate from LinkedIn'",
        coverLetterLabel: "Cover Letter",
        tailorBtn: "Tailor & Download",
        settingsTitle: "Settings",
        themeLabel: "Theme",
        languageLabel: "Language",
        themeDark: "Dark",
        themeLight: "Light",
        langEn: "English",
        langAr: "العربية",
        processing: "Processing...",
        errorPdf: "Please upload a PDF file.",
        errorApiKey: "Please enter an API Key",
        errorInvalidKey: "Invalid API Key",
        errorLinkedin: "Navigate to a LinkedIn Job page first.",
        successMask: "Masked CV downloaded!",
        successTailor: "Tailored CV generated!",
        successScrape: "Job Description scraped!"
    },
    ar: {
        appTitle: "Civify",
        appSubtitle: "خصص سيرتك الذاتية في ثوانٍ",
        apiKeyLabel: "مفتاح API",
        apiKeyPlaceholder: "أدخل مفتاح Civify API الخاص بك",
        loginBtn: "تسجيل الدخول",
        getKeyLink: "احصل عليه هنا",
        dontHaveKey: "ليس لديك مفتاح؟",
        logoutTitle: "تسجيل الخروج",
        tabMask: "تشفير البيانات",
        tabTailor: "تخصيص السيرة",
        dragDropMask: "اسحب وأفلت السيرة الذاتية (PDF)",
        dragDropTailor: "رفع السيرة الذاتية (PDF)",
        browse: "تصفح",
        maskBtn: "تشفير وتحميل",
        jdLabel: "الوصف الوظيفي",
        scrapeBtn: "جلب من LinkedIn",
        jdPlaceholder: "الصق الوصف الوظيفي أو استخدم 'جلب من LinkedIn'",
        coverLetterLabel: "خطاب مقدمة",
        tailorBtn: "تخصيص وتحميل",
        settingsTitle: "الإعدادات",
        themeLabel: "المظهر",
        languageLabel: "اللغة",
        themeDark: "داكن",
        themeLight: "فاتح",
        langEn: "English",
        langAr: "العربية",
        processing: "جارٍ المعالجة...",
        errorPdf: "يرجى رفع ملف PDF.",
        errorApiKey: "يرجى إدخال مفتاح API",
        errorInvalidKey: "مفتاح API غير صالح",
        errorLinkedin: "انتقل إلى صفحة وظيفة على LinkedIn أولاً.",
        successMask: "تم تحميل السيرة الذاتية المشفرة!",
        successTailor: "تم إنشاء السيرة الذاتية المخصصة!",
        successScrape: "تم جلب الوصف الوظيفي!"
    }
};

const I18n = {
    currentLang: 'en',
    
    // Translation dictionary exposed for direct use
    translations: translations,

    init(lang = 'en') {
        this.currentLang = lang;
        this.applyLanguage(lang);
    },

    t(key) {
        return (this.translations[this.currentLang] && this.translations[this.currentLang][key]) || key;
    },

    applyLanguage(lang) {
        this.currentLang = lang;
        const isRtl = lang === 'ar';
        document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
        document.documentElement.lang = lang;

        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translation = this.t(key);
            
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = translation;
            } else {
                // If element has child nodes (like icons), update only text node
                if (el.children.length > 0) {
                    // Find first text node
                    for (const node of el.childNodes) {
                        if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
                            node.textContent = translation;
                            break;
                        }
                    }
                } else {
                    el.textContent = translation;
                }
            }
        });
    }
};
