-- Add settings columns to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notify_training_reminders BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_streak_alerts BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_coach_messages BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_comp_reminders BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS profile_visible BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS default_session_type TEXT NOT NULL DEFAULT 'rolling',
  ADD COLUMN IF NOT EXISTS default_duration INT NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS subscription_plan TEXT NOT NULL DEFAULT 'free';
