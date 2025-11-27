// API function for Instagram Lead Scraper

const WEBHOOK_URL = "https://n8n.srv1116237.hstgr.cloud/webhook/4db839f6-9c14-4a89-8ce7-a76406ff8156";

interface InstagramScraperInput {
  searchQuery: string;
  location: string;
}

interface InstagramScraperResult {
  success: boolean;
  data?: any;
  error?: string;
}

export const runInstagramScraper = async (input: InstagramScraperInput): Promise<InstagramScraperResult> => {
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        "Who are you looking for?": input.searchQuery,
        "Location:": input.location,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return { success: true, data: { submitted: true } };
  } catch (error) {
    console.error("Instagram Scraper API error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to submit scraper request",
    };
  }
};
