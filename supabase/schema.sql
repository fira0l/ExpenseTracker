-- ============================================================
-- EXPENSE TRACKER - SUPABASE DATABASE SCHEMA
-- Designed to support: Manual entry, SMS/Email parsing,
-- and future Bank API (Plaid) integration.
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. PROFILES (extends Supabase auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name     TEXT,
  avatar_url    TEXT,
  currency      TEXT NOT NULL DEFAULT 'ETB',
  monthly_income NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================
-- 2. CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name       TEXT NOT NULL,
  icon       TEXT NOT NULL DEFAULT '💰',
  color      TEXT NOT NULL DEFAULT '#6366f1',
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default categories for a new user
CREATE OR REPLACE FUNCTION public.seed_default_categories(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.categories (user_id, name, icon, color, is_default) VALUES
    (p_user_id, 'Food & Dining',     '🍔', '#f59e0b', TRUE),
    (p_user_id, 'Transportation',    '🚗', '#3b82f6', TRUE),
    (p_user_id, 'Bills & Utilities', '💡', '#ef4444', TRUE),
    (p_user_id, 'Shopping',          '🛍️', '#8b5cf6', TRUE),
    (p_user_id, 'Entertainment',     '🎬', '#ec4899', TRUE),
    (p_user_id, 'Health & Fitness',  '🏥', '#10b981', TRUE),
    (p_user_id, 'Education',         '📚', '#0ea5e9', TRUE),
    (p_user_id, 'Travel',            '✈️', '#f97316', TRUE),
    (p_user_id, 'Savings',           '🏦', '#22c55e', TRUE),
    (p_user_id, 'Other',             '📌', '#6b7280', TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 3. TRANSACTIONS
-- source_type supports: 'manual', 'sms', 'email', 'bank_api'
-- ============================================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  category_id     UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  amount          NUMERIC(12, 2) NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('expense', 'income')),
  description     TEXT,
  notes           TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  source_type     TEXT NOT NULL DEFAULT 'manual'
                  CHECK (source_type IN ('manual', 'sms', 'email', 'bank_api')),
  -- For future bank API (Plaid) integration
  plaid_transaction_id TEXT UNIQUE,
  merchant_name   TEXT,
  merchant_logo   TEXT,
  -- Metadata for SMS/Email parsing
  raw_message     TEXT,
  parsed_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast queries by user and date
CREATE INDEX IF NOT EXISTS idx_transactions_user_date
  ON public.transactions (user_id, transaction_date DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_category
  ON public.transactions (category_id);

-- ============================================================
-- 4. BUDGETS (monthly limits per category)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.budgets (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
  amount      NUMERIC(12, 2) NOT NULL,
  month       INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  year        INT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, category_id, month, year)
);

-- ============================================================
-- 5. AUTOMATION SOURCES (for SMS/Email parsers & future Bank API)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.automation_sources (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type         TEXT NOT NULL CHECK (type IN ('sms', 'email', 'bank_api')),
  name         TEXT NOT NULL,              -- e.g. "My Bank SMS", "Gmail"
  config       JSONB NOT NULL DEFAULT '{}', -- stores parser rules, keywords, etc.
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  last_synced  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 6. ROW LEVEL SECURITY (RLS) - users only see their own data
-- ============================================================
ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_sources ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users can view own profile"   ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Categories
CREATE POLICY "Users can manage own categories" ON public.categories FOR ALL USING (auth.uid() = user_id);

-- Transactions
CREATE POLICY "Users can manage own transactions" ON public.transactions FOR ALL USING (auth.uid() = user_id);

-- Budgets
CREATE POLICY "Users can manage own budgets" ON public.budgets FOR ALL USING (auth.uid() = user_id);

-- Automation Sources
CREATE POLICY "Users can manage own automation sources" ON public.automation_sources FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 7. ANALYTICS DATA (Assets, Debt, Bills, Investments)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.net_worth_history (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  month       TEXT NOT NULL, -- Format: 'YYYY-MM' e.g. '2026-03'
  assets      NUMERIC(12, 2) NOT NULL DEFAULT 0,
  debt        NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, month)
);

CREATE TABLE IF NOT EXISTS public.upcoming_bills (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name        TEXT NOT NULL,
  amount      NUMERIC(12, 2) NOT NULL,
  due_day     INT NOT NULL CHECK (due_day BETWEEN 1 AND 31),
  icon        TEXT DEFAULT '🧾',
  color       TEXT DEFAULT '#3b82f6',
  is_paid     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.investments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name        TEXT NOT NULL,
  value       NUMERIC(12, 2) NOT NULL DEFAULT 0,
  color       TEXT DEFAULT '#10b981',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.debts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name        TEXT NOT NULL,
  amount      NUMERIC(12, 2) NOT NULL DEFAULT 0,
  interest_rate NUMERIC(5, 2) DEFAULT 0,
  color       TEXT DEFAULT '#ef4444',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.net_worth_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upcoming_bills    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts             ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own net worth history" ON public.net_worth_history FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own upcoming bills"    ON public.upcoming_bills    FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own investments"       ON public.investments       FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own debts"             ON public.debts             FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 8. RECURRING TRANSACTIONS & SAVINGS GOALS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.recurring_transactions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  category_id     UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  amount          NUMERIC(12, 2) NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('expense', 'income')),
  description     TEXT NOT NULL,
  frequency       TEXT NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  next_due_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  auto_post       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.savings_goals (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name            TEXT NOT NULL,
  target_amount   NUMERIC(12, 2) NOT NULL,
  current_amount  NUMERIC(12, 2) NOT NULL DEFAULT 0,
  target_date     DATE,
  icon            TEXT NOT NULL DEFAULT '🎯',
  color           TEXT NOT NULL DEFAULT '#10b981',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_goals          ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own recurring transactions" ON public.recurring_transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own savings goals"          ON public.savings_goals          FOR ALL USING (auth.uid() = user_id);

