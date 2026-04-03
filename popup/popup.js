document.addEventListener("DOMContentLoaded", async () => {
    // --- Elements ---
    const authView = document.getElementById("auth-view");
    const mainView = document.getElementById("main-view");
    const userNameSpan = document.getElementById("user-name");
    const creditsBadge = document.getElementById("credits-badge");
    const logoutBtn = document.getElementById("logout-btn");

    // Email/Password Login
    const loginEmailInput = document.getElementById("login-email");
    const loginPasswordInput = document.getElementById("login-password");
    const emailLoginBtn = document.getElementById("email-login-btn");
    
    // 2FA Section
    const twoFactorSection = document.getElementById("two-factor-section");
    const loginOtpInput = document.getElementById("login-otp");
    const verifyOtpBtn = document.getElementById("verify-otp-btn");
    const cancelOtpBtn = document.getElementById("cancel-otp-btn");
    const emailLoginSection = document.getElementById("email-login-section");
    const socialDivider = document.querySelector(".social-divider");
    const socialLoginButtons = document.querySelector(".social-login-buttons");
    const advancedSection = document.querySelector(".advanced-section");
    const registerLink = document.querySelector(".register-link");

    let pending2faUsername = null;

    function showTwoFactorView() {
        if(emailLoginSection) emailLoginSection.classList.add("hidden");
        if(socialDivider) socialDivider.classList.add("hidden");
        if(socialLoginButtons) socialLoginButtons.classList.add("hidden");
        if(advancedSection) advancedSection.classList.add("hidden");
        if(registerLink) registerLink.classList.add("hidden");
        if(twoFactorSection) twoFactorSection.classList.remove("hidden");
    }

    function hideTwoFactorView() {
        if(emailLoginSection) emailLoginSection.classList.remove("hidden");
        if(socialDivider) socialDivider.classList.remove("hidden");
        if(socialLoginButtons) socialLoginButtons.classList.remove("hidden");
        if(advancedSection) advancedSection.classList.remove("hidden");
        if(registerLink) registerLink.classList.remove("hidden");
        if(twoFactorSection) twoFactorSection.classList.add("hidden");
        pending2faUsername = null;
        if(loginOtpInput) loginOtpInput.value = "";
    }

    // Social Login
    const googleLoginBtn = document.getElementById("google-login-btn");
    const linkedinLoginBtn = document.getElementById("linkedin-login-btn");

    // API Key Login (Advanced)
    const toggleApiKeyBtn = document.getElementById("toggle-api-key");
    const apiKeySection = document.getElementById("api-key-section");
    const apiKeyInput = document.getElementById("api-key");
    const apiKeyLoginBtn = document.getElementById("api-key-login-btn");

    // Settings
    const settingsBtn = document.getElementById("settings-btn");
    const settingsOverlay = document.getElementById("settings-overlay");
    const closeSettingsBtn = document.getElementById("close-settings");
    const toggleBtns = document.querySelectorAll(".toggle-btn");

    // Tabs
    const tabBtns = document.querySelectorAll(".tab-btn");

    // Mask Tab
    const maskDropZone = document.getElementById("mask-drop-zone");
    const maskFileInput = document.getElementById("mask-file-input");
    const maskBrowseBtn = document.getElementById("mask-browse-btn");
    const maskFileInfo = document.getElementById("mask-file-info");
    const maskFilename = document.getElementById("mask-filename");
    const maskRemoveFile = document.getElementById("mask-remove-file");
    const maskBtn = document.getElementById("mask-btn");

    // Tailor Tab
    const tailorDropZone = document.getElementById("tailor-drop-zone");
    const tailorFileInput = document.getElementById("tailor-file-input");
    const tailorBrowseBtn = document.getElementById("tailor-browse-btn");
    const tailorFileInfo = document.getElementById("tailor-file-info");
    const tailorFilename = document.getElementById("tailor-filename");
    const tailorRemoveFile = document.getElementById("tailor-remove-file");
    const tailorBtn = document.getElementById("tailor-btn");
    const scrapeJdBtn = document.getElementById("scrape-jd-btn");
    const jobDescriptionInput = document.getElementById("job-description");
    const generateCoverLetterCheckbox = document.getElementById("generate-cover-letter");

    const statusMessage = document.getElementById("status-message");

    let maskFile = null;
    let tailorFile = null;

    // --- Profile Refresh Helper ---
    async function refreshProfile() {
        try {
            const { apiKey } = await chrome.storage.local.get("apiKey");
            if (!apiKey) return;
            const profile = await Api.validateKey(apiKey);
            await chrome.storage.local.set({ userProfile: profile });
            userNameSpan.textContent = profile.firstName || profile.username || "User";
            creditsBadge.textContent = `${profile.creditsRemaining ?? 0} Credits`;
        } catch (e) {
            console.warn("Profile refresh failed:", e.message);
            if (e.message && (e.message.includes("401") || e.message.includes("Invalid"))) {
                await chrome.storage.local.remove(["apiKey", "userProfile"]);
                showAuthView();
            }
        }
    }

    // --- Complete Login (shared by all auth methods) ---
    // Takes an API key, validates it, stores it, and shows main view
    async function completeLoginWithApiKey(apiKey) {
        const profile = await Api.validateKey(apiKey);
        await chrome.storage.local.set({ apiKey, userProfile: profile });
        showMainView(profile);
    }

    // --- OAuth Polling ---
    // After opening OAuth tab, poll for the pending token
    let oauthPollInterval = null;

    function startOAuthPolling() {
        showInfo(I18n.t("oauthWaiting"));

        // Clear any stale oauth data
        chrome.storage.local.remove(["oauthPendingToken", "oauthError", "oauthTimestamp"]);

        oauthPollInterval = setInterval(async () => {
            const data = await chrome.storage.local.get(["oauthPendingToken", "oauthError", "oauthTimestamp"]);

            // Check for timeout (60 seconds)
            if (data.oauthTimestamp && (Date.now() - data.oauthTimestamp > 60000)) {
                stopOAuthPolling();
                showError(I18n.t("errorLogin"));
                return;
            }

            // Check for error
            if (data.oauthError) {
                stopOAuthPolling();
                await chrome.storage.local.remove(["oauthError", "oauthTimestamp"]);
                showError(data.oauthError);
                return;
            }

            // Check for success
            if (data.oauthPendingToken) {
                stopOAuthPolling();
                try {
                    const accessToken = data.oauthPendingToken;
                    await chrome.storage.local.remove(["oauthPendingToken", "oauthTimestamp"]);

                    // Auto-generate API key using the access token
                    const keyResponse = await Api.autoGenerateApiKey(accessToken);
                    await completeLoginWithApiKey(keyResponse.key);
                    showSuccess(I18n.t("loginBtn") + " ✓");
                } catch (e) {
                    showError(e.message || I18n.t("errorLogin"));
                }
            }
        }, 500);
    }

    function stopOAuthPolling() {
        if (oauthPollInterval) {
            clearInterval(oauthPollInterval);
            oauthPollInterval = null;
        }
    }

    // --- Initialization ---
    try {
        const result = await chrome.storage.local.get(["apiKey", "userProfile", "theme", "lang", "oauthPendingToken", "oauthError", "oauthTimestamp"]);

        // Apply persisted settings
        applyTheme(result.theme || "dark");
        I18n.init(result.lang || "en");
        updateToggleStates(result.theme || "dark", result.lang || "en");

        if (result.apiKey) {
            showMainView(result.userProfile);
            refreshProfile();
        } else if (result.oauthPendingToken) {
            // OAuth completed while popup was closed — complete login now
            showAuthView();
            showInfo(I18n.t("oauthWaiting"));
            try {
                await chrome.storage.local.remove(["oauthPendingToken", "oauthError", "oauthTimestamp"]);
                const keyResponse = await Api.autoGenerateApiKey(result.oauthPendingToken);
                await completeLoginWithApiKey(keyResponse.key);
                showSuccess(I18n.t("loginBtn") + " ✓");
            } catch (e) {
                showError(e.message || I18n.t("errorLogin"));
            }
        } else if (result.oauthError) {
            // OAuth failed while popup was closed
            await chrome.storage.local.remove(["oauthError", "oauthTimestamp"]);
            showAuthView();
            showError(result.oauthError);
        } else {
            showAuthView();
        }
    } catch (e) {
        console.error("Initialization error:", e);
        showAuthView();
        applyTheme("dark");
        I18n.init("en");
    }

    // --- Settings Logic ---
    if (settingsBtn) {
        settingsBtn.addEventListener("click", () => {
            settingsOverlay.classList.remove("hidden");
        });
    }

    if (closeSettingsBtn) {
        closeSettingsBtn.addEventListener("click", () => {
            settingsOverlay.classList.add("hidden");
        });
    }

    if (settingsOverlay) {
        settingsOverlay.addEventListener("click", (e) => {
            if (e.target === settingsOverlay) {
                settingsOverlay.classList.add("hidden");
            }
        });
    }

    toggleBtns.forEach(btn => {
        btn.addEventListener("click", async () => {
            const setting = btn.dataset.setting;
            const value = btn.dataset.value;

            document.querySelectorAll(`.toggle-btn[data-setting="${setting}"]`).forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            if (setting === "theme") {
                applyTheme(value);
                await chrome.storage.local.set({ theme: value });
            } else if (setting === "lang") {
                I18n.applyLanguage(value);
                await chrome.storage.local.set({ lang: value });
                updateBtnState();
            }
        });
    });

    function applyTheme(theme) {
        document.body.setAttribute("data-theme", theme);

        const suffix = theme === "dark" ? "-dark" : "";

        const authLogo = document.getElementById("auth-logo");
        if (authLogo) authLogo.src = `../icons/icon128${suffix}.png`;

        const headerLogo = document.getElementById("header-logo");
        if (headerLogo) headerLogo.src = `../icons/icon48${suffix}.png`;

        chrome.runtime.sendMessage({ action: "updateTheme", theme: theme }).catch(() => {});
    }

    function updateToggleStates(theme, lang) {
        document.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.remove('active'));
        const themeBtn = document.querySelector(`.toggle-btn[data-setting="theme"][data-value="${theme}"]`);
        const langBtn = document.querySelector(`.toggle-btn[data-setting="lang"][data-value="${lang}"]`);
        if (themeBtn) themeBtn.classList.add('active');
        if (langBtn) langBtn.classList.add('active');
    }

    // ─── Auth Logic ──────────────────────────────────────────

    // 1. Email/Password Login
    emailLoginBtn.addEventListener("click", async () => {
        const email = loginEmailInput.value.trim();
        const password = loginPasswordInput.value.trim();

        if (!email) return showError(I18n.t("errorEmail"));
        if (!password) return showError(I18n.t("errorPassword"));

        setLoading(emailLoginBtn, true);
        try {
            // Step 1: Login with credentials
            const authResponse = await Api.login(email, password);

            if (authResponse.requires2FA) {
                pending2faUsername = email;
                showTwoFactorView();
                showInfo(authResponse.message || "OTP sent to your email.");
                return;
            }

            if (!authResponse.accessToken) {
                showError(authResponse.message || I18n.t("errorLogin"));
                return;
            }

            // Step 2: Auto-generate API key using access token
            const keyResponse = await Api.autoGenerateApiKey(authResponse.accessToken);

            // Step 3: Validate the key and store it
            await completeLoginWithApiKey(keyResponse.key);

            loginEmailInput.value = "";
            loginPasswordInput.value = "";
        } catch (e) {
            showError(e.message || I18n.t("errorLogin"));
        } finally {
            setLoading(emailLoginBtn, false);
        }
    });

    // Allow Enter key to submit
    loginPasswordInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") emailLoginBtn.click();
    });
    loginEmailInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") loginPasswordInput.focus();
    });

    // 2FA Handlers
    verifyOtpBtn.addEventListener("click", async () => {
        const otp = loginOtpInput.value.trim();
        if (!otp) return showError(I18n.t("errorOtp") || "Please enter OTP");
        
        setLoading(verifyOtpBtn, true);
        try {
            const authResponse = await Api.verify2fa(pending2faUsername, otp);
            if (!authResponse.accessToken) {
                showError(authResponse.message || I18n.t("errorLogin") || "Login failed");
                return;
            }
            
            // Auto-generate API key using access token
            const keyResponse = await Api.autoGenerateApiKey(authResponse.accessToken);
            await completeLoginWithApiKey(keyResponse.key);
            
            hideTwoFactorView();
            loginEmailInput.value = "";
            loginPasswordInput.value = "";
        } catch (e) {
            showError(e.message || "Verification failed");
        } finally {
            setLoading(verifyOtpBtn, false);
        }
    });

    cancelOtpBtn.addEventListener("click", () => {
        hideTwoFactorView();
    });

    // 2. Google OAuth Login
    googleLoginBtn.addEventListener("click", async () => {
        try {
            const oauthUrl = await Api.getOAuthUrl("google");
            chrome.tabs.create({ url: oauthUrl });
            startOAuthPolling();
        } catch (e) {
            showError(e.message || I18n.t("errorLogin"));
        }
    });

    // 3. LinkedIn OAuth Login
    linkedinLoginBtn.addEventListener("click", async () => {
        try {
            const oauthUrl = await Api.getOAuthUrl("linkedin");
            chrome.tabs.create({ url: oauthUrl });
            startOAuthPolling();
        } catch (e) {
            showError(e.message || I18n.t("errorLogin"));
        }
    });

    // 4. API Key Login (Advanced - toggle visibility)
    toggleApiKeyBtn.addEventListener("click", () => {
        apiKeySection.classList.toggle("hidden");
        toggleApiKeyBtn.classList.toggle("expanded");
    });

    apiKeyLoginBtn.addEventListener("click", async () => {
        const key = apiKeyInput.value.trim();
        if (!key) return showError(I18n.t("errorApiKey"));

        setLoading(apiKeyLoginBtn, true);
        try {
            await completeLoginWithApiKey(key);
            apiKeyInput.value = "";
        } catch (e) {
            showError(e.message || I18n.t("errorInvalidKey"));
        } finally {
            setLoading(apiKeyLoginBtn, false);
        }
    });

    apiKeyInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") apiKeyLoginBtn.click();
    });

    // Logout
    logoutBtn.addEventListener("click", async () => {
        stopOAuthPolling();
        await chrome.storage.local.remove(["apiKey", "userProfile"]);
        maskFile = null;
        tailorFile = null;
        showAuthView();
    });

    // --- Tab Logic ---
    tabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            tabBtns.forEach(b => b.classList.remove("active"));
            document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
            btn.classList.add("active");
            document.getElementById(`${btn.dataset.tab}-tab`).classList.add("active");
        });
    });

    // --- File Upload Logic ---
    function setupFileUpload(dropZone, fileInput, browseBtn, fileInfo, filenameSpan, removeBtn, type) {
        browseBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            fileInput.click();
        });

        dropZone.addEventListener("click", (e) => {
            if (e.target !== browseBtn) fileInput.click();
        });

        dropZone.addEventListener("dragover", (e) => {
            e.preventDefault();
            dropZone.classList.add("dragover");
        });

        dropZone.addEventListener("dragleave", () => {
            dropZone.classList.remove("dragover");
        });

        dropZone.addEventListener("drop", (e) => {
            e.preventDefault();
            dropZone.classList.remove("dragover");
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
        });

        fileInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) handleFile(file);
        });

        removeBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            if (type === "mask") maskFile = null;
            else tailorFile = null;

            fileInput.value = "";
            fileInfo.classList.add("hidden");
            dropZone.classList.remove("hidden");
            updateBtnState();
        });

        function handleFile(file) {
            if (!file.type || file.type !== "application/pdf") {
                showError(I18n.t("errorPdf"));
                return;
            }
            if (type === "mask") maskFile = file;
            else tailorFile = file;

            filenameSpan.textContent = file.name;
            dropZone.classList.add("hidden");
            fileInfo.classList.remove("hidden");
            updateBtnState();
        }
    }

    setupFileUpload(maskDropZone, maskFileInput, maskBrowseBtn, maskFileInfo, maskFilename, maskRemoveFile, "mask");
    setupFileUpload(tailorDropZone, tailorFileInput, tailorBrowseBtn, tailorFileInfo, tailorFilename, tailorRemoveFile, "tailor");

    function updateBtnState() {
        maskBtn.disabled = !maskFile;
        tailorBtn.disabled = !tailorFile || !jobDescriptionInput.value.trim();
    }

    jobDescriptionInput.addEventListener("input", updateBtnState);

    // --- Masking Logic ---
    maskBtn.addEventListener("click", async () => {
        if (!maskFile) return;
        setLoading(maskBtn, true);
        try {
            const { apiKey } = await chrome.storage.local.get("apiKey");
            const blob = await Api.maskCv(maskFile, apiKey);

            const url = URL.createObjectURL(blob);
            await chrome.downloads.download({
                url: url,
                filename: `masked_${maskFile.name}`,
                saveAs: true
            });
            showSuccess(I18n.t("successMask"));
            refreshProfile();
        } catch (e) {
            showError(e.message || "Failed to mask CV");
        } finally {
            setLoading(maskBtn, false);
        }
    });

    // --- Tailoring Logic ---
    scrapeJdBtn.addEventListener("click", async () => {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab || !tab.url || !tab.url.includes("linkedin.com/jobs")) {
                showError(I18n.t("errorLinkedin"));
                return;
            }

            setLoading(scrapeJdBtn, true);

            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ["content/linkedin-scraper.js"]
            });

            const data = await chrome.tabs.sendMessage(tab.id, { action: "scrape" });

            if (data && data.description) {
                jobDescriptionInput.value = data.description;
                updateBtnState();
                showSuccess(I18n.t("successScrape"));
            } else {
                showError("Could not find job description on this page.");
            }
        } catch (e) {
            console.error("Scrape error:", e);
            showError("Failed to scrape. Make sure you are on a LinkedIn job page.");
        } finally {
            setLoading(scrapeJdBtn, false);
        }
    });

    // --- Template Selector Logic ---
    const templateBtns = document.querySelectorAll(".template-btn");
    let selectedTemplate = "modern";

    templateBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            templateBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            selectedTemplate = btn.dataset.template;
        });
    });

    // --- Results Logic ---
    const resultsOverlay = document.getElementById("results-overlay");
    const closeResultsBtn = document.getElementById("close-results");
    const coverLetterText = document.getElementById("cover-letter-text");
    const copyBtn = document.getElementById("copy-btn");
    const atsScoreBadge = document.getElementById("ats-score-badge");
    const atsScoreValue = document.getElementById("ats-score-value");

    if (closeResultsBtn) {
        closeResultsBtn.addEventListener("click", () => {
            resultsOverlay.classList.add("hidden");
        });
    }

    if (copyBtn) {
        copyBtn.addEventListener("click", () => {
            coverLetterText.select();
            document.execCommand("copy");
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = `<span class="icon">✓</span> ${I18n.t("copied") || "Copied!"}`;
            setTimeout(() => {
                copyBtn.innerHTML = originalText;
            }, 2000);
        });
    }

    // --- Tailor & Generate Logic ---
    tailorBtn.addEventListener("click", async () => {
        if (!tailorFile || !jobDescriptionInput.value.trim()) return;
        setLoading(tailorBtn, true);

        try {
            const { apiKey } = await chrome.storage.local.get("apiKey");
            const jd = jobDescriptionInput.value;
            const options = {
                generateCoverLetter: generateCoverLetterCheckbox.checked
            };

            const tailorResponse = await Api.tailorCv(tailorFile, jd, apiKey, options);

            if (!tailorResponse || !tailorResponse.tailoredCv) {
                throw new Error("No tailored data returned from the server.");
            }

            const { tailoredCv, coverLetter, atsScore } = tailorResponse;

            const blob = await Api.generatePdf(tailoredCv, selectedTemplate);
            const url = URL.createObjectURL(blob);
            await chrome.downloads.download({
                url: url,
                filename: `tailored_cv_${selectedTemplate}.pdf`,
                saveAs: true
            });
            showSuccess(I18n.t("successTailor") || "CV Tailored & Downloaded!");
            refreshProfile();

            if (coverLetter || atsScore) {
                if (coverLetter) {
                    coverLetterText.value = coverLetter;
                    coverLetterText.parentElement.classList.remove("hidden");
                } else {
                    coverLetterText.parentElement.classList.add("hidden");
                }

                if (atsScore) {
                    atsScoreBadge.classList.remove("hidden");
                    atsScoreValue.textContent = `${atsScore.overall}%`;
                    if (atsScore.overall >= 80) atsScoreValue.style.color = "#10b981";
                    else if (atsScore.overall >= 60) atsScoreValue.style.color = "#f59e0b";
                    else atsScoreValue.style.color = "#ef4444";
                } else {
                    atsScoreBadge.classList.add("hidden");
                }

                resultsOverlay.classList.remove("hidden");
            }

        } catch (e) {
            console.error("Tailor error:", e);
            showError(e.message || "Failed to tailor CV");
        } finally {
            setLoading(tailorBtn, false);
        }
    });

    // --- UI Helpers ---
    function showAuthView() {
        authView.classList.remove("hidden");
        mainView.classList.add("hidden");
        stopOAuthPolling();
    }

    function showMainView(profile) {
        authView.classList.add("hidden");
        mainView.classList.remove("hidden");
        if (profile) {
            userNameSpan.textContent = profile.firstName || profile.username || "User";
            creditsBadge.textContent = `${profile.creditsRemaining ?? 0} Credits`;
        }
    }

    function showError(msg) {
        statusMessage.textContent = msg;
        statusMessage.className = "status-message error";
        statusMessage.classList.remove("hidden");
        setTimeout(() => statusMessage.classList.add("hidden"), 4000);
    }

    function showSuccess(msg) {
        statusMessage.textContent = msg;
        statusMessage.className = "status-message success";
        statusMessage.classList.remove("hidden");
        setTimeout(() => statusMessage.classList.add("hidden"), 3000);
    }

    function showInfo(msg) {
        statusMessage.textContent = msg;
        statusMessage.className = "status-message info";
        statusMessage.classList.remove("hidden");
    }

    function setLoading(btn, isLoading) {
        if (isLoading) {
            btn.dataset.originalText = btn.textContent;
            btn.textContent = I18n.t("processing") || "Processing...";
            btn.disabled = true;
        } else {
            btn.textContent = btn.dataset.originalText || "Submit";
            btn.disabled = false;
            if (btn === maskBtn || btn === tailorBtn || btn.id === "mask-btn" || btn.id === "tailor-btn") {
                updateBtnState();
            }
        }
    }
});
