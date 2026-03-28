-- Migration: add active column to categories
-- Run in Supabase SQL Editor

alter table public.categories
  add column if not exists active boolean not null default true;

-- Make all existing categories active by default
update public.categories set active = true where active is null;
