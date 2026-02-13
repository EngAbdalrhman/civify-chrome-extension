// Civify Background Script

chrome.runtime.onInstalled.addListener(() => {
    console.log("Civify Extension Installed");
    updateIconForTheme();
});

// Listen for system theme changes and update toolbar icon
if (self.matchMedia) {
    self.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
        updateIconForTheme();
    });
}

function updateIconForTheme() {
    const isDark = self.matchMedia && self.matchMedia("(prefers-color-scheme: dark)").matches;
    const suffix = isDark ? "-dark" : "";
    
    chrome.action.setIcon({
        path: {
            "16": `icons/icon16${suffix}.png`,
            "48": `icons/icon48${suffix}.png`,
            "128": `icons/icon128${suffix}.png`
        }
    });
}
