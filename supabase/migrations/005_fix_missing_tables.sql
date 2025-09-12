-- =====================================================================================
-- Kateriss AI Video Generator - Fix Missing Tables
-- Created: 2025-09-12
-- Description: Add missing payment_methods table and fix any schema inconsistencies
-- =====================================================================================

-- Create payment_methods table (was missing from original migration)
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

-- Create indexes for payment_methods
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_default ON payment_methods(user_id) WHERE is_default = TRUE;

-- Add RLS policies for payment_methods
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- Users can only see their own payment methods
CREATE POLICY "Users can view own payment methods" ON payment_methods
    FOR SELECT USING (auth.uid()::uuid = user_id);

-- Users can insert their own payment methods
CREATE POLICY "Users can insert own payment methods" ON payment_methods
    FOR INSERT WITH CHECK (auth.uid()::uuid = user_id);

-- Users can update their own payment methods
CREATE POLICY "Users can update own payment methods" ON payment_methods
    FOR UPDATE USING (auth.uid()::uuid = user_id);

-- Users can delete their own payment methods
CREATE POLICY "Users can delete own payment methods" ON payment_methods
    FOR DELETE USING (auth.uid()::uuid = user_id);

-- Update trigger for payment_methods
CREATE OR REPLACE FUNCTION update_payment_methods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_payment_methods_updated_at
    BEFORE UPDATE ON payment_methods
    FOR EACH ROW EXECUTE FUNCTION update_payment_methods_updated_at();

-- Ensure default payment method constraint (only one default per user)
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

CREATE TRIGGER ensure_single_default_payment_method
    BEFORE INSERT OR UPDATE ON payment_methods
    FOR EACH ROW EXECUTE FUNCTION ensure_single_default_payment_method();

-- Grant permissions
GRANT ALL ON payment_methods TO authenticated;
GRANT ALL ON payment_methods TO service_role;