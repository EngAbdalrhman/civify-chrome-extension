// Scraper for LinkedIn Jobs

(function() {
    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "scrape") {
            const data = scrapeJobDetails();
            sendResponse(data);
        }
        return true; // Keep channel open for async response if needed
    });

    function scrapeJobDetails() {
        try {
            // Selectors based on LinkedIn's DOM structure (subject to change)
            // Strategy: Look for specific semantic elements or common classes
            
            // 1. Job Title
            const titleElement = document.querySelector('.job-details-jobs-unified-top-card__job-title h1') || 
                                 document.querySelector('h1.top-card-layout__title') ||
                                 document.querySelector('h1');
            const title = titleElement ? titleElement.innerText.trim() : "";

            // 2. Company Name
            const companyElement = document.querySelector('.job-details-jobs-unified-top-card__company-name a') ||
                                   document.querySelector('.topcard__org-name-link') ||
                                   document.querySelector('.job-details-jobs-unified-top-card__company-name');
            const company = companyElement ? companyElement.innerText.trim() : "";

            // 3. Job Description
            // LinkedIn often uses a "Show more" button which might need expansion, but usually all text is in DOM hiddenly or visible
            const descriptionElement = document.querySelector('#job-details') ||
                                       document.querySelector('.jobs-description') || 
                                       document.querySelector('.description__text');
            
            let description = "";
            if (descriptionElement) {
                // Get text but preserve some meaningful whitespace/newlines
                // Simple innerText is usually good enough for LLMs
                description = descriptionElement.innerText.trim();
            }

            return {
                title,
                company,
                description
            };
        } catch (e) {
            console.error("Civify Scraper Error:", e);
            return null;
        }
    }
})();
