CREATE TABLE public.streaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  emoji text NOT NULL DEFAULT '🌸',
  color text NOT NULL DEFAULT 'pink',
  goal integer NOT NULL DEFAULT 30,
  created_on date NOT NULL DEFAULT current_date,
  done text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT streaks_color_check CHECK (color IN ('pink','mint','lav','peach','sky')),
  CONSTRAINT streaks_goal_check CHECK (goal >= 1),
  CONSTRAINT streaks_name_check CHECK (char_length(name) BETWEEN 1 AND 60)
);

CREATE INDEX streaks_user_idx ON public.streaks (user_id, created_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.streaks TO authenticated;
GRANT ALL ON public.streaks TO service_role;

ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "streaks_select_own" ON public.streaks
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "streaks_insert_own" ON public.streaks
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "streaks_update_own" ON public.streaks
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "streaks_delete_own" ON public.streaks
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);