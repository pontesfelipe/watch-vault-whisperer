-- Add status column to track active vs sold/traded watches
ALTER TABLE public.watches 
ADD COLUMN status text NOT NULL DEFAULT 'active';

-- Create an index for filtering by status
CREATE INDEX idx_watches_status ON public.watches(status);

-- Add a comment for documentation
COMMENT ON COLUMN public.watches.status IS 'Watch status: active, sold, or traded';