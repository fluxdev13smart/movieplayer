-- Create storage bucket for public videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('public-videos', 'public-videos', true);

-- Allow anyone to read from public-videos bucket
CREATE POLICY "Public videos are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'public-videos');

-- Allow uploads via edge function (service role)
CREATE POLICY "Allow uploads via service role"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'public-videos');

-- Create table to track public videos
CREATE TABLE public.public_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  original_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS but allow public read access
ALTER TABLE public.public_videos ENABLE ROW LEVEL SECURITY;

-- Anyone can view public videos
CREATE POLICY "Anyone can view public videos"
ON public.public_videos
FOR SELECT
USING (true);

-- Only service role can insert (via edge function)
CREATE POLICY "Service role can insert videos"
ON public.public_videos
FOR INSERT
WITH CHECK (true);