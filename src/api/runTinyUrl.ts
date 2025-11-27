// API function for TinyURL Shortener

interface TinyUrlInput {
  url: string;
  webhookUrl: string;
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
      }),
    });

    if (!response.ok) {
      throw new Error(`Webhook returned status ${response.status}`);
    }

    const data = await response.json();
    
    // Expecting n8n to return an object with shortenedUrl property
    if (data.shortenedUrl) {
      return {
        success: true,
        data: {
          shortenedUrl: data.shortenedUrl
        }
      };
    } else {
      throw new Error('No shortened URL received from webhook');
    }
  } catch (error) {
    console.error('Error shortening URL:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to shorten URL'
    };
  }
};
