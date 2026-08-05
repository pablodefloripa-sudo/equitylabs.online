CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address INET,
  user_agent TEXT
);

-- Enable Row Level Security
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own audit logs
CREATE POLICY "Users can view own audit logs"
ON public.audit_logs FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own audit logs (for self-logging actions)
CREATE POLICY "Users can insert own audit logs"
ON public.audit_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own audit logs (if needed, e.g., to add details)
CREATE POLICY "Users can update own audit logs"
ON public.audit_logs FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Users can delete their own audit logs (if needed for GDPR, etc.)
CREATE POLICY "Users can delete own audit logs"
ON public.audit_logs FOR DELETE
USING (auth.uid() = user_id);

-- Index for faster queries by user and time
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON public.audit_logs(action_type);