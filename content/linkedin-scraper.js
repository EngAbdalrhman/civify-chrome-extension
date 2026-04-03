// Scraper for LinkedIn Jobs
// Supports both /jobs/search/ and /jobs/view/ page layouts

(function() {
    // Prevent duplicate listener registration
    if (window.__civifyScraper) return;
    window.__civifyScraper = true;

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
            // ── 1. Job Title ──────────────────────────────────────
            const titleElement =
                document.querySelector('.job-details-jobs-unified-top-card__job-title h1') ||
                document.querySelector('.job-details-jobs-unified-top-card__job-title a') ||
                document.querySelector('.job-details-jobs-unified-top-card__job-title') ||
                document.querySelector('.t-24.t-bold.inline') ||
                document.querySelector('h1.top-card-layout__title') ||
                document.querySelector('.topcard__title') ||
                document.querySelector('h1');
            const title = titleElement ? titleElement.innerText.trim() : "";

            // ── 2. Company Name ───────────────────────────────────
            const companyElement =
                document.querySelector('.job-details-jobs-unified-top-card__company-name a') ||
                document.querySelector('.job-details-jobs-unified-top-card__company-name') ||
                document.querySelector('.job-details-jobs-unified-top-card__primary-description-container a') ||
                document.querySelector('.topcard__org-name-link') ||
                document.querySelector('.topcard__flavor a') ||
                document.querySelector('.top-card-layout__card a[data-tracking-control-name="public_jobs_topcard-org-name"]');
            const company = companyElement ? companyElement.innerText.trim() : "";

            // ── 3. Expand "Show more" if present ──────────────────
            // LinkedIn hides part of the job description behind a "Show more" button
            expandJobDescription();

            // ── 4. Job Description ────────────────────────────────
            // Try multiple selectors in order of specificity
            const descriptionSelectors = [
                // Logged-in /jobs/view/ and /jobs/search/ pages
                '#job-details',
                '.jobs-description__content',
                '.jobs-description-content__text',
                '.jobs-box__html-content',
                'article.jobs-description__container',
                // Public /jobs/view/ pages
                '.show-more-less-html__markup',
                '.description__text',
                '.jobs-description',
                // Fallback: any element with "description" in class under the job details section
                '[class*="description"] [class*="content"]',
                '[class*="description"]'
            ];

            let description = "";
            for (const selector of descriptionSelectors) {
                const element = document.querySelector(selector);
                if (element) {
                    const text = element.innerText.trim();
                    // Only use if it has substantial content (not just a label)
                    if (text.length > 50) {
                        description = text;
                        break;
                    }
                }
            }

            // ── 5. Fallback: find largest text block ──────────────
            if (!description) {
                description = findLargestTextBlock();
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

    /**
     * Click "Show more" / "See more" buttons to reveal full job description
     */
    function expandJobDescription() {
        const showMoreSelectors = [
            '.jobs-description__footer-button',           // Logged-in view
            '.show-more-less-html__button--more',          // Public view
            'button[aria-label="Show more"]',
            'button[aria-label="See more"]',
            '.artdeco-card__actions button',
            'footer button'                                // Generic footer expand
        ];

        for (const selector of showMoreSelectors) {
            const btn = document.querySelector(selector);
            if (btn && btn.offsetParent !== null) { // Check visibility
                try {
                    btn.click();
                    // Small delay isn't possible in content script sync context,
                    // but LinkedIn usually reveals content immediately via CSS toggle
                } catch (e) {
                    console.warn("Civify: Could not click expand:", e);
                }
            }
        }
    }

    /**
     * Fallback: scan the page for the largest text block that looks like a job description.
     * This handles cases where LinkedIn changes their DOM but the content is still present.
     */
    function findLargestTextBlock() {
        const candidates = document.querySelectorAll('div, section, article');
        let bestText = "";
        let bestLength = 0;

        for (const el of candidates) {
            // Skip very small or hidden elements
            if (el.offsetParent === null) continue;
            if (el.children.length > 20) continue; // Skip containers with too many children (layout elements)

            const text = el.innerText?.trim() || "";
            // Look for blocks that are substantial and contain job-related keywords
            if (text.length > 200 && text.length > bestLength) {
                const lower = text.toLowerCase();
                // Check if it looks like a job description (contains common keywords)
                const hasKeywords = ['responsibilities', 'requirements', 'qualifications', 
                                     'experience', 'about the', 'job description',
                                     'what you', 'who you', 'skills'].some(kw => lower.includes(kw));
                if (hasKeywords) {
                    bestText = text;
                    bestLength = text.length;
                }
            }
        }

        return bestText;
    }
})();
