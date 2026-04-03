// Civify Background Script

chrome.runtime.onInstalled.addListener(() => {
    console.log("Civify Extension Installed");
    updateIconForTheme();
});

// ─── Icon Theme Management ───────────────────────────────

function updateIconForTheme() {
    const suffix = ""; 
    chrome.action.setIcon({
        path: {
            "16": `/icons/icon16${suffix}.png`,
            "48": `/icons/icon48${suffix}.png`,
            "128": `/icons/icon128${suffix}.png`
        }
    }).catch(err => console.warn("Failed to set icon:", err));
}

// ─── OAuth2 Callback Interception ────────────────────────

// Listen for OAuth callback navigation.
// When backend redirects to frontendUrl/auth/callback?accessToken=...,
// we intercept it, extract the token, and pass it to the extension.
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url) {
        const url = changeInfo.url;
        // Match the OAuth callback URL patterns
        if (url.includes("/auth/callback") && url.includes("accessToken=")) {
            try {
                const urlObj = new URL(url);
                const accessToken = urlObj.searchParams.get("accessToken");

                if (accessToken) {
                    console.log("OAuth callback detected, capturing token.");

                    // Store the access token temporarily for the popup to consume
                    chrome.storage.local.set({
                        oauthPendingToken: accessToken,
                        oauthTimestamp: Date.now()
                    });

                    // Close the OAuth tab after a short delay
                    setTimeout(() => {
                        chrome.tabs.remove(tabId).catch(() => {});
                    }, 500);
                }
            } catch (e) {
                console.error("Failed to parse OAuth callback URL:", e);
            }
        }

        // Handle OAuth error callback
        if (url.includes("/auth/callback") && url.includes("error=")) {
            try {
                const urlObj = new URL(url);
                const error = urlObj.searchParams.get("error");
                chrome.storage.local.set({
                    oauthError: error || "OAuth login failed",
                    oauthTimestamp: Date.now()
                });
                setTimeout(() => {
                    chrome.tabs.remove(tabId).catch(() => {});
                }, 500);
            } catch (e) {
                console.error("Failed to parse OAuth error URL:", e);
            }
        }
    }
});

// ─── Message Listener ────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "updateTheme") {
        const suffix = message.theme === "dark" ? "-dark" : "";
        chrome.action.setIcon({
            path: {
                "16": `/icons/icon16${suffix}.png`,
                "48": `/icons/icon48${suffix}.png`,
                "128": `/icons/icon128${suffix}.png`
            }
        }).catch(console.warn);
    }
});
