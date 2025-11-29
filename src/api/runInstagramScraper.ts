// API function for Instagram Lead Scraper

const WEBHOOK_URL = "https://n8n.srv1116237.hstgr.cloud/webhook/13d740af-2c99-44d2-9ba7-c14a35007f07";

interface InstagramScraperInput {
  searchQuery: string;
  location: string;
  userId?: string | null;
  userEmail?: string | null;
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
        ...(input.userId && { userId: input.userId }),
        ...(input.userEmail && { userEmail: input.userEmail }),
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
