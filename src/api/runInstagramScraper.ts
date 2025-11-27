// API function for Instagram Lead Scraper

const WEBHOOK_URL = "https://n8n.srv1116237.hstgr.cloud/form/58528f6c-05f7-451e-9cda-12da6f61d622";

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
    const formData = new FormData();
    formData.append("Who are you looking for?", input.searchQuery);
    formData.append("Location:", input.location);

    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      body: formData,
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
