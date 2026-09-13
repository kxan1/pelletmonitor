-- Run this in Neon's SQL editor after deploying the updated backend.

-- Users: profile fields + approval workflow.
-- is_approved defaults TRUE here so your EXISTING admin account isn't
-- retroactively locked out — only NEW registrations start as unapproved.
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS organization VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- Machines: richer detail fields for the "View" panel.
ALTER TABLE machines ADD COLUMN IF NOT EXISTS manufacturer VARCHAR;
ALTER TABLE machines ADD COLUMN IF NOT EXISTS company VARCHAR;
ALTER TABLE machines ADD COLUMN IF NOT EXISTS date_bought TIMESTAMPTZ;
ALTER TABLE machines ADD COLUMN IF NOT EXISTS description VARCHAR;
ALTER TABLE machines ADD COLUMN IF NOT EXISTS image_url VARCHAR;
