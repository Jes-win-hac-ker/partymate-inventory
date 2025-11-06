-- Create spare_parts table
CREATE TABLE IF NOT EXISTS public.spare_parts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  part_id TEXT NOT NULL,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  image_url TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_part_id_per_user UNIQUE (part_id, user_id)
);

-- Enable RLS
ALTER TABLE public.spare_parts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own parts"
  ON public.spare_parts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own parts"
  ON public.spare_parts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own parts"
  ON public.spare_parts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own parts"
  ON public.spare_parts FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.spare_parts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create storage bucket for part images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'part-images',
  'part-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
CREATE POLICY "Users can upload their own part images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'part-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view part images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'part-images');

CREATE POLICY "Users can update their own part images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'part-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own part images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'part-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_spare_parts_user_id ON public.spare_parts(user_id);
CREATE INDEX IF NOT EXISTS idx_spare_parts_part_id ON public.spare_parts(part_id);
CREATE INDEX IF NOT EXISTS idx_spare_parts_quantity ON public.spare_parts(quantity);