-- Add refund_policy field to trips table for per-trip refund policies
ALTER TABLE trips ADD COLUMN IF NOT EXISTS refund_policy TEXT;
