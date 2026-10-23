-- Schema completo e idempotente: incollalo nel SQL Editor di Supabase ed eseguilo.

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
  job_title TEXT,
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

-- 6. Crea automaticamente il profilo alla registrazione di un utente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- Profili: ognuno vede e modifica solo il proprio
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Teams: visibili ai membri
DROP POLICY IF EXISTS "Members can view their team" ON teams;
CREATE POLICY "Members can view their team" ON teams
  FOR SELECT USING (
    id IN (SELECT team_id FROM profiles WHERE profiles.id = auth.uid())
  );

-- Eventi: gestibili dai membri del team
DROP POLICY IF EXISTS "Team members can manage events" ON events;
CREATE POLICY "Team members can manage events" ON events
  FOR ALL USING (
    team_id IN (SELECT team_id FROM profiles WHERE profiles.id = auth.uid())
  ) WITH CHECK (
    team_id IN (SELECT team_id FROM profiles WHERE profiles.id = auth.uid())
  );

-- Contatti: l'utente gestisce i propri o quelli del proprio team
DROP POLICY IF EXISTS "Users can manage their own or team contacts" ON contacts;
CREATE POLICY "Users can manage their own or team contacts" ON contacts
  FOR ALL USING (
    user_id = auth.uid() OR
    (team_id IS NOT NULL AND team_id IN (
      SELECT team_id FROM profiles WHERE profiles.id = auth.uid()
    ))
  ) WITH CHECK (
    user_id = auth.uid()
  );

-- Allegati: accessibili se si può accedere al contatto collegato
DROP POLICY IF EXISTS "Users can manage attachments of accessible contacts" ON attachments;
CREATE POLICY "Users can manage attachments of accessible contacts" ON attachments
  FOR ALL USING (
    contact_id IN (SELECT id FROM contacts)
  ) WITH CHECK (
    contact_id IN (SELECT id FROM contacts)
  );

-- STORAGE: bucket per le immagini dei biglietti da visita
-- (l'app non può crearlo con la chiave anon, quindi lo creiamo qui)
INSERT INTO storage.buckets (id, name, public)
VALUES ('business-cards', 'business-cards', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users can upload own business cards" ON storage.objects;
CREATE POLICY "Users can upload own business cards" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'business-cards' AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can update own business cards" ON storage.objects;
CREATE POLICY "Users can update own business cards" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'business-cards' AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can read own business cards" ON storage.objects;
CREATE POLICY "Users can read own business cards" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'business-cards' AND (storage.foldername(name))[1] = auth.uid()::text
  );
