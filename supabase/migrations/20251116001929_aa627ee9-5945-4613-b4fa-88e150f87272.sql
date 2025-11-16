-- Create enum types for watch metadata
CREATE TYPE public.watch_rarity AS ENUM ('common', 'uncommon', 'rare', 'very_rare', 'grail');
CREATE TYPE public.watch_historical_significance AS ENUM ('regular', 'notable', 'historically_significant');

-- Add new columns to watches table
ALTER TABLE public.watches
ADD COLUMN rarity watch_rarity DEFAULT 'common',
ADD COLUMN historical_significance watch_historical_significance DEFAULT 'regular',
ADD COLUMN available_for_trade boolean DEFAULT false NOT NULL;

-- Add index for filtering by availability
CREATE INDEX idx_watches_available_for_trade ON public.watches(available_for_trade) WHERE available_for_trade = true;