ALTER TABLE sheets ADD COLUMN IF NOT EXISTS additional_techs jsonb;
ALTER TABLE sheets ADD COLUMN IF NOT EXISTS additional_techs_answered boolean NOT NULL DEFAULT false;
