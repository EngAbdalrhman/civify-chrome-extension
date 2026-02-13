const PROD_API = "https://stg.civify.cv/apis/v1";
const DEV_API = "https://stg.civify.cv/apis/v1";

const Api = {
    async getBaseUrl() {
        const { devMode } = await chrome.storage.local.get("devMode");
        return devMode ? DEV_API : PROD_API;
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
    }
};
