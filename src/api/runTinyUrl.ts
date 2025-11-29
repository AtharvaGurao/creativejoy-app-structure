// API function for TinyURL Shortener

interface TinyUrlInput {
  url: string;
  webhookUrl: string;
  userId?: string | null;
  userEmail?: string | null;
}

interface TinyUrlResponse {
  success: boolean;
  data?: {
    shortenedUrl: string;
  };
  error?: string;
}

export const runTinyUrl = async (input: TinyUrlInput): Promise<TinyUrlResponse> => {
  try {
    console.log('Sending URL to n8n webhook:', input.webhookUrl);

    const response = await fetch(input.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: input.url,
        timestamp: new Date().toISOString(),
        ...(input.userId && { userId: input.userId }),
        ...(input.userEmail && { userEmail: input.userEmail }),
      }),
    });

    if (!response.ok) {
      throw new Error(`Webhook returned status ${response.status}`);
    }

    const responseText = await response.text();
    
    // Handle empty response
    if (!responseText || responseText.trim() === '') {
      throw new Error('Webhook returned empty response. Please check if your n8n workflow is configured to return the shortened URL.');
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      // If response is not JSON, check if it's a plain URL
      const urlMatch = responseText.match(/https?:\/\/[^\s]+/);
      if (urlMatch) {
        return {
          success: true,
          data: {
            shortenedUrl: urlMatch[0]
          }
        };
      }
      throw new Error('Invalid response format from webhook');
    }
    
    // Handle array response from n8n (e.g., [{"message": "..."}])
    const responseData = Array.isArray(data) ? data[0] : data;
    
    // Parse n8n response - expecting format: {"message": "Congratulations! This is your: https://tinyurl.com/..."}
    if (responseData?.message && typeof responseData.message === 'string') {
      // Extract URL from the message string
      const urlMatch = responseData.message.match(/https?:\/\/[^\s]+/);
      if (urlMatch) {
        return {
          success: true,
          data: {
            shortenedUrl: urlMatch[0]
          }
        };
      }
    }
    
    // Fallback: check if shortenedUrl is directly provided
    if (responseData?.shortenedUrl) {
      return {
        success: true,
        data: {
          shortenedUrl: responseData.shortenedUrl
        }
      };
    }
    
    throw new Error('No shortened URL received from webhook');
  } catch (error) {
    console.error('Error shortening URL:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to shorten URL'
    };
  }
};
