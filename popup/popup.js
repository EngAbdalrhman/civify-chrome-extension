document.addEventListener("DOMContentLoaded", async () => {
    // --- Elements ---
    const authView = document.getElementById("auth-view");
    const mainView = document.getElementById("main-view");
    const apiKeyInput = document.getElementById("api-key");
    const loginBtn = document.getElementById("login-btn");
    const userNameSpan = document.getElementById("user-name");
    const creditsBadge = document.getElementById("credits-badge");
    const logoutBtn = document.getElementById("logout-btn");
    
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

    // --- Initialization ---
    try {
        const result = await chrome.storage.local.get(["apiKey", "userProfile", "theme", "lang"]);
        
        // Apply persisted settings
        applyTheme(result.theme || "dark");
        I18n.init(result.lang || "en");
        updateToggleStates(result.theme || "dark", result.lang || "en");

        if (result.apiKey) {
            showMainView(result.userProfile);
        } else {
            showAuthView();
        }
    } catch (e) {
        console.error("Initialization error:", e);
        showAuthView();
        // Fallback defaults
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

    // Close settings when clicking outside panel
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

            // Update UI state
            document.querySelectorAll(`.toggle-btn[data-setting="${setting}"]`).forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            // Apply setting
            if (setting === "theme") {
                applyTheme(value);
                await chrome.storage.local.set({ theme: value });
            } else if (setting === "lang") {
                I18n.applyLanguage(value);
                await chrome.storage.local.set({ lang: value });
                // Re-update button state in case text changed/reflowed
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

        // Notify background script to update extension icon
        chrome.runtime.sendMessage({ action: "updateTheme", theme: theme }).catch(() => {
            // Ignore errors (e.g. if background script is inactive)
        });
    }
    
    function updateToggleStates(theme, lang) {
        document.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.remove('active'));
        const themeBtn = document.querySelector(`.toggle-btn[data-setting="theme"][data-value="${theme}"]`);
        const langBtn = document.querySelector(`.toggle-btn[data-setting="lang"][data-value="${lang}"]`);
        if (themeBtn) themeBtn.classList.add('active');
        if (langBtn) langBtn.classList.add('active');
    }

    // --- Auth Logic ---
    loginBtn.addEventListener("click", async () => {
        const key = apiKeyInput.value.trim();
        if (!key) return showError(I18n.t("errorApiKey"));
        
        setLoading(loginBtn, true);
        try {
            const profile = await Api.validateKey(key);
            await chrome.storage.local.set({ apiKey: key, userProfile: profile });
            showMainView(profile);
            apiKeyInput.value = "";
        } catch (e) {
            showError(e.message || I18n.t("errorInvalidKey"));
        } finally {
            setLoading(loginBtn, false);
        }
    });

    // Allow pressing Enter to login
    apiKeyInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") loginBtn.click();
    });

    logoutBtn.addEventListener("click", async () => {
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
        // Fix: Browse button click handler in JS (MV3 CSP compliant)
        browseBtn.addEventListener("click", (e) => {
            e.stopPropagation(); // Prevent bubbling to dropZone click
            fileInput.click();
        });

        // Click on drop zone also triggers upload (if not clicking browse button)
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
            
            // 1. Call Tailor API
            const tailorResponse = await Api.tailorCv(tailorFile, jd, apiKey, options);
            
            if (!tailorResponse || !tailorResponse.tailoredCv) {
                throw new Error("No tailored data returned from the server.");
            }

            const { tailoredCv, coverLetter, atsScore } = tailorResponse;

            // 2. Generate PDF (Server-side only)
            const blob = await Api.generatePdf(tailoredCv, selectedTemplate);
            const url = URL.createObjectURL(blob);
            await chrome.downloads.download({
                url: url,
                filename: `tailored_cv_${selectedTemplate}.pdf`,
                saveAs: true
            });
            showSuccess(I18n.t("successTailor") || "CV Tailored & Downloaded!");

            // 3. Show Cover Letter / Results if available
            if (coverLetter || atsScore) {
                if (coverLetter) {
                    coverLetterText.value = coverLetter;
                    coverLetterText.parentElement.classList.remove("hidden"); // Ensure text area is visible
                } else {
                    coverLetterText.parentElement.classList.add("hidden");
                }

                if (atsScore) {
                    atsScoreBadge.classList.remove("hidden");
                    atsScoreValue.textContent = `${atsScore.overall}%`;
                    // Color coding
                    if (atsScore.overall >= 80) atsScoreValue.style.color = "#10b981"; // green
                    else if (atsScore.overall >= 60) atsScoreValue.style.color = "#f59e0b"; // orange
                    else atsScoreValue.style.color = "#ef4444"; // red
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

    function setLoading(btn, isLoading) {
        if (isLoading) {
            btn.dataset.originalText = btn.textContent;
            btn.textContent = I18n.t("processing") || "Processing...";
            btn.disabled = true;
        } else {
            btn.textContent = btn.dataset.originalText || "Tailor & Download";
            updateBtnState();
        }
    }
});
