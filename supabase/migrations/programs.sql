-- Programs (coach-created templates)
CREATE TABLE IF NOT EXISTS public.programs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  content jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Coach manages own programs" ON public.programs
  FOR ALL USING (auth.uid() = coach_id);

-- Programs assigned to clients
CREATE TABLE IF NOT EXISTS public.client_programs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id uuid REFERENCES public.programs(id) ON DELETE SET NULL,
  client_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  coach_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  content jsonb NOT NULL DEFAULT '[]',
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.client_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Coach manages client programs" ON public.client_programs
  FOR ALL USING (auth.uid() = coach_id);
CREATE POLICY "Client reads own programs" ON public.client_programs
  FOR SELECT USING (auth.uid() = client_id);
