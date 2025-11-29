// API function for LinkedIn Content Parasite

interface LinkedinParasiteInput {
  linkedinUrl1: string;
  linkedinUrl2: string;
}

interface LinkedinParasiteResponse {
  success: boolean;
  data?: any;
  error?: string;
}

const WEBHOOK_URL = "https://n8n.srv1116237.hstgr.cloud/form/b054ccd7-593f-4aa3-9aaa-45f26d817bfc";

export const runLinkedinParasite = async (input: LinkedinParasiteInput): Promise<LinkedinParasiteResponse> => {
  try {
    console.log("Sending LinkedIn URLs to n8n webhook");

    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        linkedinUrl1: input.linkedinUrl1,
        linkedinUrl2: input.linkedinUrl2,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Webhook returned status ${response.status}`);
    }

    const responseText = await response.text();

    // Handle empty response as success (webhook might not return data)
    if (!responseText || responseText.trim() === "") {
      return {
        success: true,
        data: null,
      };
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      // If response is not JSON, return as plain text
      return {
        success: true,
        data: responseText,
      };
    }

    // Handle array response from n8n
    const responseData = Array.isArray(data) ? data[0] : data;

    return {
      success: true,
      data: responseData,
    };
  } catch (error) {
    console.error("Error submitting LinkedIn URLs:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to submit LinkedIn URLs",
    };
  }
};
