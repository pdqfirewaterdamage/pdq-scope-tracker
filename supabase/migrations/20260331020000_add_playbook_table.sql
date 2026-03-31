-- Playbook settings (key/value store for admin panel)
CREATE TABLE IF NOT EXISTS playbook (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE playbook ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read playbook" ON playbook FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can insert playbook" ON playbook FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update playbook" ON playbook FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Anon can read playbook" ON playbook FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can insert playbook" ON playbook FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can update playbook" ON playbook FOR UPDATE TO anon USING (true);

-- Techs table
CREATE TABLE IF NOT EXISTS techs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  closing_ratio numeric NOT NULL DEFAULT 0,
  avg_job_size numeric NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE techs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read techs" ON techs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can manage techs" ON techs FOR ALL TO authenticated USING (true);
CREATE POLICY "Anon can read techs" ON techs FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can manage techs" ON techs FOR ALL TO anon USING (true);

-- Seed default techs
INSERT INTO techs (name, code, closing_ratio, avg_job_size) VALUES
  ('Chris B', 'CB', 74, 11200),
  ('Jerry K', 'JK', 70, 10400),
  ('Leo T', 'LT', 65, 9100),
  ('David P', 'DP', 62, 8300)
ON CONFLICT (code) DO NOTHING;
