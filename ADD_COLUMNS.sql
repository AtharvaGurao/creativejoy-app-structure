-- STEP 1: Add user_id and user_email columns to youtube_shorts table
-- Copy and paste this into Supabase SQL Editor and run it

ALTER TABLE youtube_shorts 
ADD COLUMN user_id TEXT,
ADD COLUMN user_email TEXT;

-- STEP 2: (Optional) Add indexes for better query performance
CREATE INDEX idx_youtube_shorts_user_id ON youtube_shorts(user_id);
CREATE INDEX idx_youtube_shorts_user_email ON youtube_shorts(user_email);
