// API function for YouTube Shorts Maker using Kie AI

const KIE_API_KEY = '6c2096deba369fe68cc983e3dae561a0';
const KIE_API_URL = 'https://api.kie.ai/api/v1/jobs/createTask';
const KIE_QUERY_URL = 'https://api.kie.ai/api/v1/jobs/recordInfo';

interface ShortsInput {
  videoIdea: string;
  callBackUrl?: string;
  aspectRatio?: 'landscape' | 'portrait' | 'square';
  nFrames?: number;
}

interface ShortsResponse {
  success: boolean;
  data?: {
    jobId?: string;
    status?: string;
    message?: string;
    [key: string]: any;
  };
  error?: string;
}

/**
 * Creates a video generation task using KIE API
 * 
 * Sends a POST request to the KIE API to create a video generation task.
 * Uses model "sora-2-text-to-video".
 * 
 * Inputs include: prompt, aspect_ratio, n_frames, and remove_watermark.
 * Returns the taskId from the API response along with full response data.
 * 
 * @param input - Input parameters for video generation
 * @returns Promise with success status and data containing taskId
 */
export const runShorts = async (input: ShortsInput): Promise<ShortsResponse> => {
  try {
    const requestBody = {
      model: 'sora-2-text-to-video',
      callBackUrl: input.callBackUrl || 'https://your-domain.com/api/callback',
      input: {
        prompt: input.videoIdea,
        aspect_ratio: input.aspectRatio || 'portrait', // Default to portrait for YouTube Shorts
        n_frames: String(input.nFrames || 10), // Convert to string as per API requirement
        remove_watermark: true
      }
    };

    console.log('Creating YouTube Short task with Kie AI');
    console.log('Request URL:', KIE_API_URL);
    console.log('Request Body:', JSON.stringify(requestBody, null, 2));
    console.log('API Key:', KIE_API_KEY.substring(0, 10) + '...');

    const response = await fetch(KIE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KIE_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    console.log('Response Status:', response.status);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('Raw Response:', responseText);

    if (!response.ok) {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = { message: responseText || `HTTP ${response.status}` };
      }
      console.error('Kie API Error:', errorData);
      throw new Error(errorData.message || errorData.error || `Kie API returned status ${response.status}: ${responseText}`);
    }

    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      throw new Error(`Invalid JSON response: ${responseText}`);
    }

    console.log('Kie API Success Response:', result);

    // Handle Kie API response format: { code, message, data: { taskId, state, resultJson, ... } }
    if (result.code === 200 && result.data) {
      const taskData = result.data;
      
      // Parse resultJson if it exists
      let parsedResult = null;
      if (taskData.resultJson) {
        try {
          parsedResult = JSON.parse(taskData.resultJson);
        } catch (e) {
          console.warn('Failed to parse resultJson:', e);
        }
      }

      return {
        success: true,
        data: {
          jobId: taskData.taskId,
          status: taskData.state || 'pending',
          message: result.message || 'Your YouTube Short task has been created successfully!',
          model: taskData.model,
          result: parsedResult,
          resultUrls: parsedResult?.resultUrls || [],
          resultWaterMarkUrls: parsedResult?.resultWaterMarkUrls || [],
          failCode: taskData.failCode,
          failMsg: taskData.failMsg,
          completeTime: taskData.completeTime,
          createTime: taskData.createTime,
          updateTime: taskData.updateTime,
          ...taskData
        }
      };
    }

    // Fallback for different response formats
    return {
      success: true,
      data: {
        jobId: result.data?.taskId || result.id || result.job_id || result.jobId || result.task_id,
        status: result.data?.state || result.status || result.state,
        message: result.message || 'Your YouTube Short task has been created successfully!',
        ...result
      }
    };
  } catch (error) {
    console.error('Error creating YouTube Short with Kie AI:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create YouTube Short';
    return {
      success: false,
      error: errorMessage
    };
  }
};

// Query task status
interface QueryTaskResponse {
  success: boolean;
  data?: {
    taskId?: string;
    status?: string;
    result?: any;
    [key: string]: any;
  };
  error?: string;
}

export const queryTaskStatus = async (taskId: string): Promise<QueryTaskResponse> => {
  try {
    const queryUrl = `${KIE_QUERY_URL}?taskId=${encodeURIComponent(taskId)}`;
    
    console.log('Querying task status from Kie AI');
    console.log('Query URL:', queryUrl);

    const response = await fetch(queryUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${KIE_API_KEY}`
      }
    });

    console.log('Query Response Status:', response.status);

    const responseText = await response.text();
    console.log('Raw Query Response:', responseText);

    if (!response.ok) {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = { message: responseText || `HTTP ${response.status}` };
      }
      console.error('Kie API Query Error:', errorData);
      throw new Error(errorData.message || errorData.error || `Kie API returned status ${response.status}: ${responseText}`);
    }

    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      throw new Error(`Invalid JSON response: ${responseText}`);
    }

    console.log('Kie API Query Success Response:', result);

    // Handle Kie API response format: { code, message, data: { taskId, state, resultJson, ... } }
    if (result.code === 200 && result.data) {
      const taskData = result.data;
      
      // Parse resultJson if it exists
      let parsedResult = null;
      if (taskData.resultJson) {
        try {
          parsedResult = JSON.parse(taskData.resultJson);
        } catch (e) {
          console.warn('Failed to parse resultJson:', e);
        }
      }

      return {
        success: true,
        data: {
          taskId: taskData.taskId,
          status: taskData.state || 'unknown',
          model: taskData.model,
          result: parsedResult,
          resultUrls: parsedResult?.resultUrls || [],
          resultWaterMarkUrls: parsedResult?.resultWaterMarkUrls || [],
          failCode: taskData.failCode,
          failMsg: taskData.failMsg,
          completeTime: taskData.completeTime,
          createTime: taskData.createTime,
          updateTime: taskData.updateTime,
          ...taskData
        }
      };
    }

    // Fallback for different response formats
    return {
      success: true,
      data: {
        taskId: result.data?.taskId || result.taskId || result.task_id || result.id || taskId,
        status: result.data?.state || result.status || result.state || 'unknown',
        result: result.data?.resultJson ? (() => {
          try {
            return JSON.parse(result.data.resultJson);
          } catch {
            return result.data.resultJson;
          }
        })() : result.result || result.data || result,
        ...result
      }
    };
  } catch (error) {
    console.error('Error querying task status from Kie AI:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to query task status';
    return {
      success: false,
      error: errorMessage
    };
  }
};
