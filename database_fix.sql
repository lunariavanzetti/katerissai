-- =====================================================================================
-- Kateriss AI Video Generator - Database Fix Script
-- Run this in Supabase SQL Editor to fix missing tables and schema issues
-- =====================================================================================

-- First, let's check if the enums exist, and create them if they don't
DO $$
BEGIN
    -- Create usage_event_type enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'usage_event_type') THEN
        CREATE TYPE usage_event_type AS ENUM (
            'video_generated',
            'video_downloaded',
            'api_call',
            'storage_used',
            'bandwidth_used'
        );
    END IF;

    -- Create invoice_status enum if it doesn't exist  
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_status') THEN
        CREATE TYPE invoice_status AS ENUM (
            'draft',
            'sent',
            'paid',
            'overdue',
            'canceled',
            'refunded'
        );
    END IF;
END $$;

-- Create payment_methods table if it doesn't exist
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    paddle_payment_method_id TEXT UNIQUE,
    type TEXT NOT NULL, -- 'card', 'paypal', 'bank', etc.
    brand TEXT, -- 'visa', 'mastercard', etc.
    last4 TEXT, -- Last 4 digits for cards
    exp_month INTEGER, -- Expiry month for cards
    exp_year INTEGER, -- Expiry year for cards
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Ensure usage_events table exists with correct schema
CREATE TABLE IF NOT EXISTS usage_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    type usage_event_type NOT NULL,
    count INTEGER DEFAULT 1 NOT NULL,
    video_id UUID REFERENCES videos(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Ensure invoices table exists
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    paddle_invoice_id TEXT UNIQUE,
    number TEXT NOT NULL,
    status invoice_status NOT NULL DEFAULT 'draft',
    amount DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0 NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    description TEXT NOT NULL,
    line_items JSONB NOT NULL DEFAULT '[]',
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    due_at TIMESTAMPTZ NOT NULL,
    paid_at TIMESTAMPTZ,
    download_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_default ON payment_methods(user_id) WHERE is_default = TRUE;
CREATE INDEX IF NOT EXISTS idx_usage_events_user_id ON usage_events(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_type ON usage_events(type);
CREATE INDEX IF NOT EXISTS idx_usage_events_timestamp ON usage_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

-- Enable RLS on all tables
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;  
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Users can insert own payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Users can update own payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Users can delete own payment methods" ON payment_methods;

DROP POLICY IF EXISTS "Users can view own usage events" ON usage_events;
DROP POLICY IF EXISTS "Users can insert own usage events" ON usage_events;

DROP POLICY IF EXISTS "Users can view own invoices" ON invoices;
DROP POLICY IF EXISTS "Service role can manage invoices" ON invoices;

-- Create RLS policies for payment_methods
CREATE POLICY "Users can view own payment methods" ON payment_methods
    FOR SELECT USING (auth.uid()::uuid = user_id);

CREATE POLICY "Users can insert own payment methods" ON payment_methods
    FOR INSERT WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY "Users can update own payment methods" ON payment_methods
    FOR UPDATE USING (auth.uid()::uuid = user_id);

CREATE POLICY "Users can delete own payment methods" ON payment_methods
    FOR DELETE USING (auth.uid()::uuid = user_id);

-- Create RLS policies for usage_events
CREATE POLICY "Users can view own usage events" ON usage_events
    FOR SELECT USING (auth.uid()::uuid = user_id);

CREATE POLICY "Users can insert own usage events" ON usage_events
    FOR INSERT WITH CHECK (auth.uid()::uuid = user_id);

-- Create RLS policies for invoices
CREATE POLICY "Users can view own invoices" ON invoices
    FOR SELECT USING (auth.uid()::uuid = user_id);

CREATE POLICY "Service role can manage invoices" ON invoices
    FOR ALL USING (auth.role() = 'service_role');

-- Create or replace functions for updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_payment_methods_updated_at ON payment_methods;
CREATE TRIGGER update_payment_methods_updated_at
    BEFORE UPDATE ON payment_methods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create constraint function for default payment methods
CREATE OR REPLACE FUNCTION ensure_single_default_payment_method()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = TRUE THEN
        -- Unset all other default payment methods for this user
        UPDATE payment_methods 
        SET is_default = FALSE 
        WHERE user_id = NEW.user_id AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_single_default_payment_method ON payment_methods;
CREATE TRIGGER ensure_single_default_payment_method
    BEFORE INSERT OR UPDATE ON payment_methods
    FOR EACH ROW EXECUTE FUNCTION ensure_single_default_payment_method();

-- Grant permissions
GRANT ALL ON payment_methods TO authenticated;
GRANT ALL ON payment_methods TO service_role;
GRANT ALL ON usage_events TO authenticated;
GRANT ALL ON usage_events TO service_role;
GRANT ALL ON invoices TO authenticated;
GRANT ALL ON invoices TO service_role;

-- Print success message
SELECT 'Database tables created successfully!' as result;