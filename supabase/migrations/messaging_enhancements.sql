-- Add attachment support to messages
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS attachment_url text,
  ADD COLUMN IF NOT EXISTS attachment_type text; -- 'audio' | 'image' | 'file'

-- Add automated_message field to autoflow template steps
ALTER TABLE autoflow_template_steps
  ADD COLUMN IF NOT EXISTS automated_message text;

-- Create storage bucket for voice notes / message attachments (run separately via dashboard or CLI if needed)
-- insert into storage.buckets (id, name, public) values ('message-attachments', 'message-attachments', false)
-- on conflict do nothing;
