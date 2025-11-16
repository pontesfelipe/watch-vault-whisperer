-- Create table to store user acceptance of terms and privacy policy
CREATE TABLE public.terms_acceptances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  registration_request_id uuid REFERENCES public.registration_requests(id) ON DELETE CASCADE,
  accepted_terms boolean NOT NULL DEFAULT false,
  accepted_privacy boolean NOT NULL DEFAULT false,
  terms_version text NOT NULL DEFAULT 'Beta v1.0',
  privacy_version text NOT NULL DEFAULT 'Beta v1.0',
  accepted_at timestamp with time zone NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.terms_acceptances ENABLE ROW LEVEL SECURITY;

-- Admins can view all acceptances
CREATE POLICY "Admins can view all acceptances"
  ON public.terms_acceptances
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Anyone can insert their own acceptance (for registration)
CREATE POLICY "Anyone can insert acceptance"
  ON public.terms_acceptances
  FOR INSERT
  WITH CHECK (true);

-- Add terms acceptance fields to registration_requests
ALTER TABLE public.registration_requests
ADD COLUMN accepted_terms boolean NOT NULL DEFAULT false,
ADD COLUMN accepted_privacy boolean NOT NULL DEFAULT false,
ADD COLUMN terms_version text DEFAULT 'Beta v1.0',
ADD COLUMN privacy_version text DEFAULT 'Beta v1.0';