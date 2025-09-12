-- =====================================================================================
-- Kateriss AI Video Generator - Simple Database Fix
-- Run this in Supabase SQL Editor to fix database issues step by step
-- =====================================================================================

-- First, let's see what tables exist
SELECT schemaname, tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Check if usage_events table exists and its structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'usage_events'
ORDER BY ordinal_position;

-- Check if invoices table exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'invoices'
ORDER BY ordinal_position;

-- Check if payment_methods table exists  
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'payment_methods'
ORDER BY ordinal_position;