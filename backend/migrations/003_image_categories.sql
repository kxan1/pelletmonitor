-- Run this in Neon's SQL editor after deploying the updated backend.
-- (site_settings is a brand new table — created automatically, no migration needed for it.)

ALTER TABLE uploaded_images ADD COLUMN IF NOT EXISTS category VARCHAR DEFAULT 'general';
