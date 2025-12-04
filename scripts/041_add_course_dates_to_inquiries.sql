-- Add course_start_date and course_end_date columns to inquiries table
ALTER TABLE public.inquiries 
ADD COLUMN IF NOT EXISTS course_start_date date,
ADD COLUMN IF NOT EXISTS course_end_date date;

-- Add comment for documentation
COMMENT ON COLUMN public.inquiries.course_start_date IS 'The start date for golf course play, must be within travel dates';
COMMENT ON COLUMN public.inquiries.course_end_date IS 'The end date for golf course play, must be within travel dates';
