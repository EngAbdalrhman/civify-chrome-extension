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
            oauthTimestamp: Date.now(),
          });

          // Close the OAuth tab after a short delay
          setTimeout(() => {
            chrome.tabs.update(tabId, {
              url: `data:text/html,
<html>
  <head><title>✅ Success</title></head>
  <body style="font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; text-align: center; padding: 4rem 2rem; max-width: 500px; margin: 0 auto;">
    <div style="font-size: 4rem; color: #10b981;">✅</div>
    <h1 style="font-size: 2rem; margin: 1rem 0;">Login Successful!</h1>
    <p style="color: #6b7280; margin: 1rem 0;">Your Civify extension is now authenticated.</p>
    <p style="color: #6b7280;">You can close this tab or return to the extension popup.</p>
    <button onclick="window.close()" style="background: #3b82f6; color: white; border: none; padding: 0.75rem 2rem; border-radius: 0.5rem; font-size: 1rem; cursor: pointer; margin-top: 1rem;">Close Tab</button>
    <script>
      // Auto-close after 5s inactivity
      setTimeout(() => window.close(), 5000);
    </script>
  </body>
</html>`,
            });
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
          oauthTimestamp: Date.now(),
        });
        setTimeout(() => {
          chrome.tabs.update(tabId, {
            url: `data:text/html,
<html>
  <head><title>❌ OAuth Error</title></head>
  <body style="font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; text-align: center; padding: 4rem 2rem; max-width: 500px; margin: 0 auto;">
    <div style="font-size: 4rem; color: #ef4444;">❌</div>
    <h1 style="font-size: 2rem; margin: 1rem 0;">OAuth Login Failed</h1>
    <p style="color: #6b7280; margin: 1rem 0;">${error || "Unknown error"}</p>
    <p style="color: #6b7280;">Please try again from the extension popup.</p>
    <button onclick="window.close()" style="background: #6b7280; color: white; border: none; padding: 0.75rem 2rem; border-radius: 0.5rem; font-size: 1rem; cursor: pointer; margin-top: 1rem;">Close Tab</button>
    <script>setTimeout(() => window.close(), 5000);</script>
  </body>
</html>`,
          });
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
