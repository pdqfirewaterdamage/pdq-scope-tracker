-- PDQ Scope Tracker — Migration V2
-- Run this if you already have the V1 schema and need to add new columns
-- Run in: Supabase Dashboard → SQL Editor → New Query

-- Sheets: add weekend_sheet column
ALTER TABLE sheets ADD COLUMN IF NOT EXISTS weekend_sheet boolean NOT NULL DEFAULT false;

-- Rooms: add measurements column
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS measurements jsonb;

-- Items: add new fields
ALTER TABLE items ADD COLUMN IF NOT EXISTS require_photo boolean NOT NULL DEFAULT false;
ALTER TABLE items ADD COLUMN IF NOT EXISTS qty_value text;
ALTER TABLE items ADD COLUMN IF NOT EXISTS drop_value text;
