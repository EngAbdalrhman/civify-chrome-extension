document.addEventListener("DOMContentLoaded", async () => {
    // --- Elements ---
    const authView = document.getElementById("auth-view");
    const mainView = document.getElementById("main-view");
    const apiKeyInput = document.getElementById("api-key");
    const loginBtn = document.getElementById("login-btn");
    const userNameSpan = document.getElementById("user-name");
    const creditsBadge = document.getElementById("credits-badge");
    const logoutBtn = document.getElementById("logout-btn");
    
    // Tabs
    const tabBtns = document.querySelectorAll(".tab-btn");
    
    // Mask Tab
    const maskDropZone = document.getElementById("mask-drop-zone");
    const maskFileInput = document.getElementById("mask-file-input");
    const maskFileInfo = document.getElementById("mask-file-info");
    const maskFilename = document.getElementById("mask-filename");
    const maskRemoveFile = document.getElementById("mask-remove-file");
    const maskBtn = document.getElementById("mask-btn");
    
    // Tailor Tab
    const tailorDropZone = document.getElementById("tailor-drop-zone");
    const tailorFileInput = document.getElementById("tailor-file-input");
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
        const result = await chrome.storage.local.get(["apiKey", "userProfile"]);
        if (result.apiKey) {
            showMainView(result.userProfile);
        } else {
            showAuthView();
        }
    } catch (e) {
        showAuthView();
    }

    // --- Auth Logic ---
    loginBtn.addEventListener("click", async () => {
        const key = apiKeyInput.value.trim();
        if (!key) return showError("Please enter an API Key");
        
        setLoading(loginBtn, true);
        try {
            const profile = await Api.validateKey(key);
            await chrome.storage.local.set({ apiKey: key, userProfile: profile });
            showMainView(profile);
            apiKeyInput.value = "";
        } catch (e) {
            showError(e.message || "Invalid API Key");
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
    function setupFileUpload(dropZone, fileInput, fileInfo, filenameSpan, removeBtn, type) {
        // Click on the drop-zone text (not on the browse button which has its own onclick)
        dropZone.addEventListener("click", (e) => {
            if (e.target.tagName !== "BUTTON") fileInput.click();
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
                showError("Please upload a PDF file.");
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

    setupFileUpload(maskDropZone, maskFileInput, maskFileInfo, maskFilename, maskRemoveFile, "mask");
    setupFileUpload(tailorDropZone, tailorFileInput, tailorFileInfo, tailorFilename, tailorRemoveFile, "tailor");

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
            showSuccess("Masked CV downloaded!");
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
                showError("Navigate to a LinkedIn Job page first.");
                return;
            }

            setLoading(scrapeJdBtn, true);

            // Inject content script if not already injected, then send message
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ["content/linkedin-scraper.js"]
            });

            const data = await chrome.tabs.sendMessage(tab.id, { action: "scrape" });
            
            if (data && data.description) {
                jobDescriptionInput.value = data.description;
                updateBtnState();
                showSuccess("Job Description scraped!");
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

    tailorBtn.addEventListener("click", async () => {
        if (!tailorFile || !jobDescriptionInput.value.trim()) return;
        setLoading(tailorBtn, true);
        
        try {
            const { apiKey } = await chrome.storage.local.get("apiKey");
            const jd = jobDescriptionInput.value;
            const options = {
                generateCoverLetter: generateCoverLetterCheckbox.checked
            };
            
            const response = await Api.tailorCv(tailorFile, jd, apiKey, options);
            
            if (response && response.tailoredCv) {
                if (typeof PdfGenerator !== "undefined" && window.jspdf) {
                    PdfGenerator.generate(response.tailoredCv, jd);
                    showSuccess("Tailored CV generated!");
                } else {
                    showError("PDF Generator not loaded. Please reload the extension.");
                }
            } else {
                showError("No tailored data returned from the server.");
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
        statusMessage.className = "error";
        setTimeout(() => statusMessage.classList.add("hidden"), 4000);
    }
    
    function showSuccess(msg) {
        statusMessage.textContent = msg;
        statusMessage.className = "success";
        setTimeout(() => statusMessage.classList.add("hidden"), 3000);
    }

    function setLoading(btn, isLoading) {
        if (isLoading) {
            btn.dataset.originalText = btn.textContent;
            btn.textContent = "Processing...";
            btn.disabled = true;
        } else {
            btn.textContent = btn.dataset.originalText || btn.textContent;
            // Re-evaluate disabled state for action buttons
            updateBtnState();
        }
    }
});
