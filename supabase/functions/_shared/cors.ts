// =====================================================================================
// Kateriss AI Video Generator - Shared CORS Configuration
// Created: 2025-09-09
// Description: Centralized CORS headers for all Supabase Edge Functions
// =====================================================================================

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 
    'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}