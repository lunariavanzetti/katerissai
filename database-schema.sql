-- =====================================================================================
-- Kateriss AI Video Generator - Complete Database Schema
-- Created: 2025-01-20
-- Description: Complete database setup with tables, RLS policies, and functions
-- =====================================================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- =====================================================================================
-- PROFILES TABLE
-- =====================================================================================

create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  bio text,
  website text,
  subscription_tier text default 'pay-per-video' check (subscription_tier in ('pay-per-video', 'basic', 'premium')),
  subscription_id text,
  paddle_customer_id text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  last_login timestamptz,
  is_active boolean default true,
  preferences jsonb default '{}'::jsonb
);

-- =====================================================================================
-- VIDEOS TABLE
-- =====================================================================================

create table public.videos (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  prompt text not null,
  enhanced_prompt text,
  settings jsonb default '{}'::jsonb,
  status text default 'pending' check (status in ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  stage text default 'queued',
  progress integer default 0 check (progress >= 0 and progress <= 100),
  estimated_time_remaining integer,
  video_url text,
  thumbnail_url text,
  preview_url text,
  metadata jsonb default '{}'::jsonb,
  veo_job_id text,
  cost_credits integer default 1 not null,
  generation_time integer,
  error jsonb,
  retry_count integer default 0,
  max_retries integer default 3,
  is_favorite boolean default false,
  is_public boolean default false,
  download_count integer default 0,
  view_count integer default 0,
  tags text[] default array[]::text[],
  category text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  completed_at timestamptz
);

-- =====================================================================================
-- VIDEO THUMBNAILS TABLE
-- =====================================================================================

create table public.video_thumbnails (
  id uuid default uuid_generate_v4() primary key,
  video_id uuid references public.videos(id) on delete cascade not null,
  url text not null,
  timestamp integer not null,
  width integer not null,
  height integer not null,
  format text not null,
  file_size integer not null,
  is_default boolean default false,
  created_at timestamptz default now() not null
);

-- =====================================================================================
-- USER USAGE TABLE
-- =====================================================================================

create table public.user_usage (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null unique,
  plan text default 'pay-per-video' check (plan in ('pay-per-video', 'basic', 'premium')),
  credits_total integer default 0,
  credits_used integer default 0,
  credits_remaining integer default 0,
  reset_date timestamptz default (now() + interval '1 month'),
  videos_per_day_limit integer default 3,
  videos_per_month_limit integer default 20,
  max_duration integer default 30, -- seconds
  max_resolution text default '720p',
  concurrent_generations integer default 1,
  videos_today integer default 0,
  videos_this_month integer default 0,
  total_videos_generated integer default 0,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- =====================================================================================
-- SUBSCRIPTIONS TABLE
-- =====================================================================================

create table public.subscriptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  paddle_subscription_id text unique not null,
  paddle_customer_id text not null,
  plan_id text not null,
  plan_name text not null,
  status text not null check (status in ('active', 'trialing', 'past_due', 'canceled', 'unpaid', 'incomplete')),
  current_period_start timestamptz not null,
  current_period_end timestamptz not null,
  cancel_at_period_end boolean default false,
  canceled_at timestamptz,
  trial_start timestamptz,
  trial_end timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- =====================================================================================
-- PAYMENT TRANSACTIONS TABLE
-- =====================================================================================

create table public.payment_transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  paddle_transaction_id text unique not null,
  type text not null check (type in ('subscription', 'one_time', 'credit_purchase')),
  amount integer not null, -- in cents
  currency text default 'USD',
  status text not null check (status in ('completed', 'pending', 'failed', 'refunded')),
  description text,
  credits_purchased integer default 0,
  paddle_receipt_url text,
  created_at timestamptz default now() not null
);

-- =====================================================================================
-- USAGE EVENTS TABLE
-- =====================================================================================

create table public.usage_events (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  event_type text not null check (event_type in ('video_generated', 'credit_used', 'subscription_created', 'subscription_canceled')),
  credits_used integer default 0,
  video_id uuid references public.videos(id) on delete set null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now() not null
);

-- =====================================================================================
-- API KEYS TABLE (for programmatic access)
-- =====================================================================================

create table public.api_keys (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  key_hash text unique not null,
  key_preview text not null, -- first 8 chars for display
  permissions text[] default array['videos:create', 'videos:read']::text[],
  is_active boolean default true,
  last_used_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz default now() not null
);

-- =====================================================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.videos enable row level security;
alter table public.video_thumbnails enable row level security;
alter table public.user_usage enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payment_transactions enable row level security;
alter table public.usage_events enable row level security;
alter table public.api_keys enable row level security;

-- Profiles policies
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Videos policies
create policy "Users can view own videos" on public.videos for select using (auth.uid() = user_id or is_public = true);
create policy "Users can create own videos" on public.videos for insert with check (auth.uid() = user_id);
create policy "Users can update own videos" on public.videos for update using (auth.uid() = user_id);
create policy "Users can delete own videos" on public.videos for delete using (auth.uid() = user_id);

-- Video thumbnails policies
create policy "Users can view thumbnails for accessible videos" on public.video_thumbnails for select 
using (exists (select 1 from public.videos where videos.id = video_thumbnails.video_id and (videos.user_id = auth.uid() or videos.is_public = true)));

-- User usage policies
create policy "Users can view own usage" on public.user_usage for select using (auth.uid() = user_id);
create policy "Users can update own usage" on public.user_usage for update using (auth.uid() = user_id);

-- Subscriptions policies
create policy "Users can view own subscriptions" on public.subscriptions for select using (auth.uid() = user_id);

-- Payment transactions policies
create policy "Users can view own transactions" on public.payment_transactions for select using (auth.uid() = user_id);

-- Usage events policies
create policy "Users can view own usage events" on public.usage_events for select using (auth.uid() = user_id);

-- API keys policies
create policy "Users can view own API keys" on public.api_keys for select using (auth.uid() = user_id);
create policy "Users can create own API keys" on public.api_keys for insert with check (auth.uid() = user_id);
create policy "Users can update own API keys" on public.api_keys for update using (auth.uid() = user_id);
create policy "Users can delete own API keys" on public.api_keys for delete using (auth.uid() = user_id);

-- =====================================================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================================================

-- Function to handle user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  
  insert into public.user_usage (user_id, plan)
  values (new.id, 'pay-per-video');
  
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Add updated_at triggers to relevant tables
create trigger handle_profiles_updated_at before update on public.profiles for each row execute procedure public.handle_updated_at();
create trigger handle_videos_updated_at before update on public.videos for each row execute procedure public.handle_updated_at();
create trigger handle_user_usage_updated_at before update on public.user_usage for each row execute procedure public.handle_updated_at();
create trigger handle_subscriptions_updated_at before update on public.subscriptions for each row execute procedure public.handle_updated_at();

-- Function to track usage events
create or replace function public.track_video_generation(user_uuid uuid, video_uuid uuid, credits_used_count integer default 1)
returns void as $$
begin
  -- Record usage event
  insert into public.usage_events (user_id, event_type, credits_used, video_id)
  values (user_uuid, 'video_generated', credits_used_count, video_uuid);
  
  -- Update user usage
  update public.user_usage 
  set 
    credits_used = credits_used + credits_used_count,
    credits_remaining = greatest(0, credits_remaining - credits_used_count),
    videos_today = videos_today + 1,
    videos_this_month = videos_this_month + 1,
    total_videos_generated = total_videos_generated + 1,
    updated_at = now()
  where user_id = user_uuid;
end;
$$ language plpgsql security definer;

-- Function to reset daily limits
create or replace function public.reset_daily_limits()
returns void as $$
begin
  update public.user_usage set videos_today = 0;
end;
$$ language plpgsql security definer;

-- Function to reset monthly limits  
create or replace function public.reset_monthly_limits()
returns void as $$
begin
  update public.user_usage 
  set 
    videos_this_month = 0,
    reset_date = now() + interval '1 month',
    credits_remaining = case 
      when plan = 'basic' then 20
      when plan = 'premium' then 9999
      else credits_remaining
    end;
end;
$$ language plpgsql security definer;

-- Function to initialize user usage (can be called manually)
create or replace function public.initialize_user_usage(user_uuid uuid, user_plan text default 'pay-per-video')
returns void as $$
begin
  insert into public.user_usage (user_id, plan, credits_remaining)
  values (user_uuid, user_plan, 
    case 
      when user_plan = 'basic' then 20
      when user_plan = 'premium' then 9999
      else 0
    end
  )
  on conflict (user_id) do nothing;
end;
$$ language plpgsql security definer;

-- =====================================================================================
-- STORAGE BUCKETS
-- =====================================================================================

-- Create storage buckets
insert into storage.buckets (id, name, public) values ('videos', 'videos', true);
insert into storage.buckets (id, name, public) values ('thumbnails', 'thumbnails', true);
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);

-- Storage policies
create policy "Users can upload their own videos" on storage.objects for insert with check (bucket_id = 'videos' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users can view all videos" on storage.objects for select using (bucket_id = 'videos');
create policy "Users can update own videos" on storage.objects for update using (bucket_id = 'videos' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users can delete own videos" on storage.objects for delete using (bucket_id = 'videos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can upload their own thumbnails" on storage.objects for insert with check (bucket_id = 'thumbnails' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users can view all thumbnails" on storage.objects for select using (bucket_id = 'thumbnails');
create policy "Users can update own thumbnails" on storage.objects for update using (bucket_id = 'thumbnails' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users can delete own thumbnails" on storage.objects for delete using (bucket_id = 'thumbnails' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can upload their own avatar" on storage.objects for insert with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users can view all avatars" on storage.objects for select using (bucket_id = 'avatars');
create policy "Users can update own avatar" on storage.objects for update using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users can delete own avatar" on storage.objects for delete using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- =====================================================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================================================

-- Videos table indexes
create index videos_user_id_idx on public.videos(user_id);
create index videos_status_idx on public.videos(status);
create index videos_created_at_idx on public.videos(created_at desc);
create index videos_is_public_idx on public.videos(is_public) where is_public = true;
create index videos_tags_idx on public.videos using gin(tags);

-- Usage events indexes
create index usage_events_user_id_idx on public.usage_events(user_id);
create index usage_events_created_at_idx on public.usage_events(created_at desc);
create index usage_events_event_type_idx on public.usage_events(event_type);

-- Subscriptions indexes  
create index subscriptions_user_id_idx on public.subscriptions(user_id);
create index subscriptions_status_idx on public.subscriptions(status);
create index subscriptions_paddle_id_idx on public.subscriptions(paddle_subscription_id);

-- Payment transactions indexes
create index payment_transactions_user_id_idx on public.payment_transactions(user_id);
create index payment_transactions_created_at_idx on public.payment_transactions(created_at desc);
create index payment_transactions_paddle_id_idx on public.payment_transactions(paddle_transaction_id);

-- API keys indexes
create index api_keys_user_id_idx on public.api_keys(user_id);
create index api_keys_hash_idx on public.api_keys(key_hash);
create index api_keys_active_idx on public.api_keys(is_active) where is_active = true;

-- =====================================================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================================================

-- This section is commented out - uncomment if you want sample data
/*
-- Note: This requires actual user UUIDs from auth.users table
-- You can run this after creating your first user account

-- Sample user data (replace with actual UUID after user creation)
-- insert into public.profiles (id, email, full_name, subscription_tier) 
-- values ('your-user-uuid-here', 'test@example.com', 'Test User', 'basic');

-- Sample video data  
-- insert into public.videos (user_id, title, description, prompt, status) 
-- values ('your-user-uuid-here', 'My First AI Video', 'A test video', 'A beautiful sunset over mountains', 'completed');
*/

-- =====================================================================================
-- COMPLETION MESSAGE
-- =====================================================================================

-- Display success message
DO $$ 
BEGIN 
    RAISE NOTICE '🎉 Kateriss AI Database Schema Setup Complete! 🎉';
    RAISE NOTICE 'Tables created: profiles, videos, video_thumbnails, user_usage, subscriptions, payment_transactions, usage_events, api_keys';
    RAISE NOTICE 'Storage buckets: videos, thumbnails, avatars';  
    RAISE NOTICE 'RLS policies enabled for security';
    RAISE NOTICE 'Triggers and functions configured';
    RAISE NOTICE 'Ready to connect your app! 🚀';
END $$;