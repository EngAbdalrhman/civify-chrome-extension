// Civify Background Script

chrome.runtime.onInstalled.addListener(() => {
  console.log("Civify Extension Installed");
  updateIconForTheme();
});

// ─── Icon Theme Management ───────────────────────────────

function updateIconForTheme() {
  const suffix = "";
  chrome.action
    .setIcon({
      path: {
        16: `/icons/icon16${suffix}.png`,
        48: `/icons/icon48${suffix}.png`,
        128: `/icons/icon128${suffix}.png`,
      },
    })
    .catch((err) => console.warn("Failed to set icon:", err));
}

// ─── Message Listener ────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "updateTheme") {
    const suffix = message.theme === "dark" ? "-dark" : "";
    chrome.action
      .setIcon({
        path: {
          16: `/icons/icon16${suffix}.png`,
          48: `/icons/icon48${suffix}.png`,
          128: `/icons/icon128${suffix}.png`,
        },
      })
      .catch(console.warn);
  }
});
