// History management for YouTube Shorts using Supabase

import { externalSupabase } from './externalSupabase';

export interface ShortsHistoryItem {
  id: number;
  task_id: string;
  prompt: string;
  video_url: string | null;
  watermark_video_url: string | null;
  created_at: string;
  user_id?: string | null;
  user_email?: string | null;
}

/**
 * Save a YouTube Shorts result to Supabase
 */
export const saveShortsHistory = async (item: {
  taskId: string;
  prompt: string;
  videoUrls?: string[];
  watermarkedUrls?: string[];
  status?: string;
  model?: string;
  userId?: string | null;
  userEmail?: string | null;
}): Promise<boolean> => {
  try {
    // Get the first video URL and watermark URL from arrays
    const videoUrl = item.videoUrls && item.videoUrls.length > 0 ? item.videoUrls[0] : null;
    const watermarkUrl = item.watermarkedUrls && item.watermarkedUrls.length > 0 ? item.watermarkedUrls[0] : null;

    const insertData: any = {
      task_id: item.taskId,
      prompt: item.prompt,
      video_url: videoUrl,
      watermark_video_url: watermarkUrl,
    };

    // Add user information if provided (only if columns exist in database)
    // Note: Make sure to add user_id and user_email columns to your Supabase table first
    if (item.userId) {
      insertData.user_id = item.userId;
    }
    if (item.userEmail) {
      insertData.user_email = item.userEmail;
    }

    const { data, error } = await externalSupabase
      .from('youtube_shorts')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error saving to Supabase:', error);
      throw error;
    }

    console.log('Saved to Supabase:', data);
    return true;
  } catch (error) {
    console.error('Error saving history:', error);
    return false;
  }
};

/**
 * Get all YouTube Shorts history items from Supabase
 * If userId or userEmail is provided, filters by that user
 */
export const getShortsHistory = async (userId?: string | null, userEmail?: string | null): Promise<ShortsHistoryItem[]> => {
  try {
    let query = externalSupabase
      .from('youtube_shorts')
      .select('*');

    // Filter by user if provided
    if (userId) {
      query = query.eq('user_id', userId);
    } else if (userEmail) {
      query = query.eq('user_email', userEmail);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching history from Supabase:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error loading history:', error);
    return [];
  }
};

/**
 * Delete a history item by ID from Supabase
 * Optionally verify ownership by userId or userEmail
 */
export const deleteShortsHistoryItem = async (
  id: number,
  userId?: string | null,
  userEmail?: string | null
): Promise<boolean> => {
  try {
    let query = externalSupabase
      .from('youtube_shorts')
      .delete()
      .eq('id', id);

    // If user info provided, ensure they can only delete their own items
    if (userId) {
      query = query.eq('user_id', userId);
    } else if (userEmail) {
      query = query.eq('user_email', userEmail);
    }

    const { error } = await query;

    if (error) {
      console.error('Error deleting from Supabase:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error deleting history item:', error);
    return false;
  }
};

/**
 * Clear all history from Supabase
 */
export const clearShortsHistory = async (): Promise<boolean> => {
  try {
    // Get all IDs first, then delete them
    const { data: allItems, error: fetchError } = await externalSupabase
      .from('youtube_shorts')
      .select('id');

    if (fetchError) {
      console.error('Error fetching items to delete:', fetchError);
      throw fetchError;
    }

    if (!allItems || allItems.length === 0) {
      return true; // Nothing to delete
    }

    const ids = allItems.map(item => item.id);
    const { error } = await externalSupabase
      .from('youtube_shorts')
      .delete()
      .in('id', ids);

    if (error) {
      console.error('Error clearing history from Supabase:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error clearing history:', error);
    return false;
  }
};
