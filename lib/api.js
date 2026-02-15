const PROD_API = "https://civify.cv/apis/v1";
const DEV_API = "https://stg.civify.cv/apis/v1";

const Api = {
    async getBaseUrl() {
        const { devMode } = await chrome.storage.local.get("devMode");
        return devMode ? DEV_API : PROD_API;
    },

    async getFrontendBaseUrl() {
        const { devMode } = await chrome.storage.local.get("devMode");
        // Frontend PDF generation is usually on prod URL even in dev, 
        // but if we have a staging frontend we could use it.
        // For now, assuming dev mode might want to hit localhost or staging if available.
        return devMode ? "https://stg.civify.cv" : "https://civify.cv";
    },
 
    async validateKey(apiKey) {
        const baseUrl = await this.getBaseUrl();
        const response = await fetch(`${baseUrl}/external/cvs/user/profile`, {
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

        const response = await fetch(`${baseUrl}/external/cvs/mask`, {
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

        const response = await fetch(`${baseUrl}/external/cvs/tailor`, {
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
