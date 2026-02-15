// Civify Background Script

chrome.runtime.onInstalled.addListener(() => {
    console.log("Civify Extension Installed");
    updateIconForTheme();
});

// Listen for system theme changes and update toolbar icon
// Note: matchMedia is not supported in Service Workers.
// We default to standard icons or could read from storage if set by popup.
function updateIconForTheme() {
    // Default to light/standard icons as we can't detect OS theme easily in SW
    // To support theme syncing, we'd need to listen to a message from a content script or popup.
    const suffix = ""; 
    
    // Use absolute paths to avoid resolution issues
    chrome.action.setIcon({
        path: {
            "16": `/icons/icon16${suffix}.png`,
            "48": `/icons/icon48${suffix}.png`,
            "128": `/icons/icon128${suffix}.png`
        }
    }).catch(err => console.warn("Failed to set icon:", err));
}

// Listen for messages from popup/content scripts to update icon if needed
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
