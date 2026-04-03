const translations = {
    en: {
        appTitle: "Civify",
        appSubtitle: "Tailor your resume instantly",
        apiKeyLabel: "API Key",
        apiKeyPlaceholder: "Enter your Civify API Key",
        emailLabel: "Email",
        emailPlaceholder: "Enter your email",
        passwordLabel: "Password",
        passwordPlaceholder: "Enter your password",
        loginBtn: "Login",
        loginWithApiKey: "Login with API Key",
        loginWithEmail: "Login with Email",
        socialLoginTitle: "Or continue with",
        googleBtn: "Continue with Google",
        linkedinBtn: "Continue with LinkedIn",
        advancedToggle: "Advanced: Use API Key",
        noAccount: "Don't have an account?",
        registerLink: "Register here",
        getKeyLink: "Get one here",
        dontHaveKey: "Don't have a key?",
        errorEmail: "Please enter your email",
        errorPassword: "Please enter your password",
        errorLogin: "Login failed",
        oauthWaiting: "Completing login...",
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
        errorPdf: "Please upload a PDF file",
        errorApiKey: "Please enter an API Key",
        errorInvalidKey: "Invalid API Key",
        errorLinkedin: "Please visit a LinkedIn job page",
        successMask: "Masked CV downloaded!",
        successTailor: "CV Tailored & Downloaded!",
        successScrape: "Job description loaded!",
        templateLabel: "Template",
        templateModern: "Modern",
        templateClassic: "Classic",
        templateCreative: "Creative",
        coverLetterTitle: "Cover Letter",
        atsScoreLabel: "ATS Score",
        copyBtn: "Copy"
    },
    ar: {
        appTitle: "Civify",
        appSubtitle: "خصص سيرتك الذاتية في ثوانٍ",
        apiKeyLabel: "مفتاح API",
        apiKeyPlaceholder: "أدخل مفتاح Civify API الخاص بك",
        emailLabel: "البريد الإلكتروني",
        emailPlaceholder: "أدخل بريدك الإلكتروني",
        passwordLabel: "كلمة المرور",
        passwordPlaceholder: "أدخل كلمة المرور",
        loginBtn: "تسجيل الدخول",
        loginWithApiKey: "تسجيل الدخول بمفتاح API",
        loginWithEmail: "تسجيل الدخول بالبريد",
        socialLoginTitle: "أو تابع باستخدام",
        googleBtn: "المتابعة مع جوجل",
        linkedinBtn: "المتابعة مع لينكد إن",
        advancedToggle: "متقدم: استخدم مفتاح API",
        noAccount: "ليس لديك حساب؟",
        registerLink: "سجل هنا",
        getKeyLink: "احصل عليه هنا",
        dontHaveKey: "ليس لديك مفتاح؟",
        errorEmail: "الرجاء إدخال البريد الإلكتروني",
        errorPassword: "الرجاء إدخال كلمة المرور",
        errorLogin: "فشل تسجيل الدخول",
        oauthWaiting: "جاري إتمام تسجيل الدخول...",
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
        coverLetterLabel: "إنشاء خطاب مقدمة",
        tailorBtn: "تخصيص وتحميل",
        settingsTitle: "الإعدادات",
        themeLabel: "المظهر",
        languageLabel: "اللغة",
        themeDark: "داكن",
        themeLight: "فاتح",
        langEn: "English",
        langAr: "العربية",
        processing: "جاري المعالجة...",
        errorPdf: "الرجاء تحميل ملف PDF",
        errorApiKey: "الرجاء إدخال مفتاح API",
        errorInvalidKey: "مفتاح API غير صالح",
        errorLinkedin: "الرجاء زيارة صفحة وظيفة على لينكد إن",
        successMask: "تم تحميل السيرة المخفية!",
        successTailor: "تم تخصيص وتحميل السيرة!",
        successScrape: "تم جلب الوصف الوظيفي!",
        templateLabel: "القالب",
        templateModern: "مودرن",
        templateClassic: "كلاسيك",
        templateCreative: "إبداعي",
        coverLetterTitle: "خطاب المقدمة",
        atsScoreLabel: "نتائج ATS",
        copyBtn: "نسخ"
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
