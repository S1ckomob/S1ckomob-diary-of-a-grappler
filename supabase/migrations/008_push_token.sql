ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS push_token TEXT,
  ADD COLUMN IF NOT EXISTS training_reminder_time TEXT NOT NULL DEFAULT '07:00';
