-- Add user_id and user_email columns to youtube_shorts table
-- Run this in your Supabase SQL Editor

ALTER TABLE youtube_shorts 
ADD COLUMN IF NOT EXISTS user_id TEXT,
ADD COLUMN IF NOT EXISTS user_email TEXT;

-- Optional: Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_youtube_shorts_user_id ON youtube_shorts(user_id);
CREATE INDEX IF NOT EXISTS idx_youtube_shorts_user_email ON youtube_shorts(user_email);

-- Optional: Add a comment to document the columns
COMMENT ON COLUMN youtube_shorts.user_id IS 'Supabase Auth user ID';
COMMENT ON COLUMN youtube_shorts.user_email IS 'User email address for filtering history';
