// API function for Viral Script Maker

interface ViralScriptInput {
  videoFile: File;
  topic: string;
  targetFormat: string;
  brandVoice: string;
  targetAudience: string;
  followerCount: number;
  webhookUrl: string;
  userId?: string | null;
  userEmail?: string | null;
}

interface ViralScriptResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export const runViralScript = async (input: ViralScriptInput): Promise<ViralScriptResponse> => {
  try {
    console.log("Sending viral script data to n8n webhook:", input.webhookUrl);

    // Create FormData for multipart/form-data submission (required for file upload)
    const formData = new FormData();
    formData.append("videoFile", input.videoFile);
    formData.append("topic", input.topic);
    formData.append("targetFormat", input.targetFormat);
    formData.append("brandVoice", input.brandVoice);
    formData.append("targetAudience", input.targetAudience);
    formData.append("followerCount", input.followerCount.toString());
    formData.append("timestamp", new Date().toISOString());
    
    // Add user information if provided
    if (input.userId) {
      formData.append("userId", input.userId);
    }
    if (input.userEmail) {
      formData.append("userEmail", input.userEmail);
    }

    const response = await fetch(input.webhookUrl, {
      method: "POST",
      // Don't set Content-Type header - browser will set it automatically with boundary for FormData
      body: formData,
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
    console.error("Error submitting viral script data:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to submit viral script data",
    };
  }
};
