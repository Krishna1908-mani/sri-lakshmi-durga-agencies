-- ==============================================================================
-- Migration: Add promotional email preference to users table
-- Safe, backward-compatible migration for Sri Lakshmi Durga Agencies
-- ==============================================================================

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS marketing_emails_enabled BOOLEAN DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_users_marketing_emails 
ON public.users (marketing_emails_enabled);

COMMENT ON COLUMN public.users.marketing_emails_enabled IS 'Indicates whether the customer has opted in to promotional offers and marketing emails';
