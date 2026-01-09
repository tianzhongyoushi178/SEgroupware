-- Add pinned_message_id column to threads table
ALTER TABLE threads
ADD COLUMN pinned_message_id UUID REFERENCES messages(id);

-- Add comment for documentation
COMMENT ON COLUMN threads.pinned_message_id IS 'ID of the message pinned as an announcement';
