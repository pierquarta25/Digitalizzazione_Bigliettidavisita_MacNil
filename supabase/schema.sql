-- 1. Tabella Teams
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Estensione Profili Utente (collegata a auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  team_id UUID REFERENCES teams(id),
  role TEXT DEFAULT 'sales', -- 'admin' o 'sales'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabella Eventi
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT,
  date TIMESTAMP WITH TIME ZONE,
  team_id UUID REFERENCES teams(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabella Contatti (Il Cuore)
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  role TEXT,
  website TEXT,
  address TEXT,
  notes TEXT,
  lead_category TEXT, -- 'hot', 'warm', 'cold'
  interest TEXT,
  status TEXT DEFAULT 'new', -- 'new', 'contacted', 'follow-up', 'client'
  scan_source TEXT DEFAULT 'manual', -- 'ocr', 'qr', 'manual'
  user_id UUID REFERENCES auth.users(id), -- Sales owner
  event_id UUID REFERENCES events(id),
  team_id UUID REFERENCES teams(id),
  hubspot_id TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Tabella Allegati
CREATE TABLE IF NOT EXISTS attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type TEXT, -- 'image/jpeg', 'audio/wav', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ROW LEVEL SECURITY (RLS)
-- Abilita RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- Esempio di policy: Un utente vede solo i contatti del proprio team
CREATE POLICY "Users can see contacts of their team" ON contacts
  FOR ALL USING (
    team_id IN (
      SELECT team_id FROM profiles WHERE profiles.id = auth.uid()
    )
  );

-- Altre policy simili per events e attachments...
