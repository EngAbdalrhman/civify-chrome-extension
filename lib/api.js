const PROD_API = "https://civify.cv/apis";
const DEV_API = "https://stg.civify.cv/apis";

const Api = {
    async getBaseUrl() {
        const { devMode } = await chrome.storage.local.get("devMode");
        return devMode ? DEV_API : PROD_API;
    },

    async getFrontendBaseUrl() {
        const { devMode } = await chrome.storage.local.get("devMode");
        return devMode ? "https://stg.civify.cv" : "https://civify.cv";
    },

    // ─── Auth Methods ────────────────────────────────────────

    /**
     * Login with email/password. Returns { accessToken, refreshToken, requires2FA, message }.
     */
    async login(email, password) {
        const baseUrl = await this.getBaseUrl();
        const response = await fetch(`${baseUrl}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            const status = response.status;
            let errorMsg = "Login failed";
            try {
                const body = await response.json();
                errorMsg = body.message || body.error || errorMsg;
            } catch (_) {}
            if (status === 401) throw new Error(errorMsg);
            throw new Error(`Login failed (${status}): ${errorMsg}`);
        }
        return await response.json();
    },

    /**
     * Verify 2FA OTP. Returns { accessToken, refreshToken, message }.
     */
    async verify2fa(username, code) {
        const baseUrl = await this.getBaseUrl();
        const response = await fetch(`${baseUrl}/auth/verify-otp`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json"
            },
            body: new URLSearchParams({ username, code })
        });

        if (!response.ok) {
            const status = response.status;
            let errorMsg = "Verification failed";
            try {
                const body = await response.json();
                errorMsg = body.message || body.error || errorMsg;
            } catch (_) {}
            if (status === 401) throw new Error(errorMsg);
            throw new Error(`Verification failed (${status}): ${errorMsg}`);
        }
        return await response.json();
    },

    /**
     * Auto-generate an API key using a JWT access token.
     * Returns { key: "cv-fy-..." }.
     */
    async autoGenerateApiKey(accessToken) {
        const baseUrl = await this.getBaseUrl();
        const response = await fetch(`${baseUrl}/api-keys/auto-generate`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Accept": "application/json"
            }
        });

        if (!response.ok) {
            const status = response.status;
            if (status === 401 || status === 403) throw new Error("Session expired. Please login again.");
            throw new Error(`Failed to generate API key (${status})`);
        }
        return await response.json();
    },

    /**
     * Get the OAuth2 authorization URL for a given provider.
     */
    async getOAuthUrl(provider) {
        const baseUrl = await this.getBaseUrl();
        return `${baseUrl}/oauth2/authorization/${provider}`;
    },

    // ─── External API Methods (API Key based) ────────────────

    async validateKey(apiKey) {
        const baseUrl = await this.getBaseUrl();
        const response = await fetch(`${baseUrl}/v1/external/cvs/user/profile`, {
            headers: {
                "X-API-KEY": apiKey,
                "Accept": "application/json"
            }
        });
        if (!response.ok) {
            const status = response.status;
            if (status === 401 || status === 403) throw new Error("Invalid API Key");
            throw new Error(`Server error (${status})`);
        }
        return await response.json();
    },

    async maskCv(file, apiKey) {
        const baseUrl = await this.getBaseUrl();
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(`${baseUrl}/v1/external/cvs/mask`, {
            method: "POST",
            headers: { "X-API-KEY": apiKey },
            body: formData
        });

        if (!response.ok) {
            const status = response.status;
            if (status === 401 || status === 403) throw new Error("Session expired. Please re-login.");
            throw new Error(`Failed to mask CV (${status})`);
        }
        return await response.blob();
    },

    async tailorCv(file, jobDescription, apiKey, options = {}) {
        const baseUrl = await this.getBaseUrl();
        const formData = new FormData();
        formData.append("file", file);
        formData.append("jobDescription", jobDescription);
        
        if (options.generateCoverLetter) {
            formData.append("generateCoverLetter", "true");
        }

        const response = await fetch(`${baseUrl}/v1/external/cvs/tailor`, {
            method: "POST",
            headers: { "X-API-KEY": apiKey },
            body: formData
        });

        if (!response.ok) {
            const status = response.status;
            if (status === 401 || status === 403) throw new Error("Session expired. Please re-login.");
            if (status === 429) throw new Error("Rate limited. Please try again shortly.");
            throw new Error(`Failed to tailor CV (${status})`);
        }
        return await response.json();
    },

    async generatePdf(resumeData, template = "modern", color = "#000000") {
        const baseUrl = await this.getFrontendBaseUrl();
        const response = await fetch(`${baseUrl}/api/generate-pdf`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                resumeData,
                template,
                color
            })
        });

        if (!response.ok) {
            throw new Error(`PDF Generation failed (${response.status})`);
        }
        return await response.blob();
    }
};
