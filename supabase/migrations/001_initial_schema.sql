-- ============================================================
-- Diary of a Grappler — Initial Schema
-- ============================================================

-- 1. GYMS
create table public.gyms (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  code       text unique not null,
  coach_id   uuid references auth.users(id),
  plan       text not null default 'free',
  created_at timestamptz not null default now()
);

alter table public.gyms enable row level security;

-- Gym is readable by any authenticated user (needed for join-by-code)
create policy "Gyms are viewable by authenticated users"
  on public.gyms for select
  to authenticated
  using (true);

-- Only the coach who owns the gym can insert / update / delete
create policy "Coach can manage own gym"
  on public.gyms for all
  to authenticated
  using (coach_id = auth.uid())
  with check (coach_id = auth.uid());


-- 2. PROFILES
create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  name            text,
  belt            text not null default 'white',
  stripes         int  not null default 0,
  gym_id          uuid references public.gyms(id),
  coach_id        uuid references auth.users(id),
  dna_guard       real not null default 0,
  dna_passing     real not null default 0,
  dna_submissions real not null default 0,
  dna_takedowns   real not null default 0,
  dna_escapes     real not null default 0,
  weight_class    text,
  gi              boolean not null default true,
  nogi            boolean not null default true,
  unit_system     text not null default 'metric',
  training_goals  text,
  created_at      timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Allow the trigger to insert on behalf of a new user
create policy "Service can insert profile"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

-- Coaches can view profiles of athletes in their gym
create policy "Coaches can view gym members"
  on public.profiles for select
  to authenticated
  using (
    gym_id in (
      select g.id from public.gyms g where g.coach_id = auth.uid()
    )
  );


-- 3. SESSIONS
create table public.sessions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  date             date not null default current_date,
  session_type     text not null default 'rolling',
  duration_minutes int,
  notes            text,
  rounds           int,
  taps_given       int not null default 0,
  taps_received    int not null default 0,
  created_at       timestamptz not null default now()
);

alter table public.sessions enable row level security;

create policy "Users can view own sessions"
  on public.sessions for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can insert own sessions"
  on public.sessions for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can update own sessions"
  on public.sessions for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete own sessions"
  on public.sessions for delete
  to authenticated
  using (user_id = auth.uid());


-- 4. TECHNIQUES
create table public.techniques (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  category    text not null,
  subcategory text,
  description text,
  difficulty  text not null default 'beginner',
  is_beginner boolean not null default true,
  video_url   text,
  created_at  timestamptz not null default now()
);

alter table public.techniques enable row level security;

-- Technique library is readable by everyone
create policy "Techniques are viewable by authenticated users"
  on public.techniques for select
  to authenticated
  using (true);


-- 5. SESSION_TECHNIQUES
create table public.session_techniques (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null references public.sessions(id) on delete cascade,
  technique_id uuid not null references public.techniques(id),
  notes        text
);

alter table public.session_techniques enable row level security;

create policy "Users can view own session techniques"
  on public.session_techniques for select
  to authenticated
  using (
    session_id in (
      select s.id from public.sessions s where s.user_id = auth.uid()
    )
  );

create policy "Users can insert own session techniques"
  on public.session_techniques for insert
  to authenticated
  with check (
    session_id in (
      select s.id from public.sessions s where s.user_id = auth.uid()
    )
  );

create policy "Users can update own session techniques"
  on public.session_techniques for update
  to authenticated
  using (
    session_id in (
      select s.id from public.sessions s where s.user_id = auth.uid()
    )
  )
  with check (
    session_id in (
      select s.id from public.sessions s where s.user_id = auth.uid()
    )
  );

create policy "Users can delete own session techniques"
  on public.session_techniques for delete
  to authenticated
  using (
    session_id in (
      select s.id from public.sessions s where s.user_id = auth.uid()
    )
  );


-- 6. GOALS
create table public.goals (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  goal_type    text not null,
  description  text,
  target       int,
  current      int not null default 0,
  unit         text,
  month        int not null,
  year         int not null,
  set_by_coach boolean not null default false,
  coach_note   text,
  completed    boolean not null default false,
  created_at   timestamptz not null default now()
);

alter table public.goals enable row level security;

create policy "Users can view own goals"
  on public.goals for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can insert own goals"
  on public.goals for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can update own goals"
  on public.goals for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete own goals"
  on public.goals for delete
  to authenticated
  using (user_id = auth.uid());

-- Coaches can set goals for athletes in their gym
create policy "Coaches can insert goals for gym members"
  on public.goals for insert
  to authenticated
  with check (
    user_id in (
      select p.id from public.profiles p
      where p.gym_id in (
        select g.id from public.gyms g where g.coach_id = auth.uid()
      )
    )
  );

create policy "Coaches can view gym member goals"
  on public.goals for select
  to authenticated
  using (
    user_id in (
      select p.id from public.profiles p
      where p.gym_id in (
        select g.id from public.gyms g where g.coach_id = auth.uid()
      )
    )
  );


-- ============================================================
-- AUTO-CREATE PROFILE ON SIGN-UP
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ============================================================
-- INDEXES
-- ============================================================

create index idx_sessions_user_id    on public.sessions(user_id);
create index idx_sessions_date       on public.sessions(date);
create index idx_goals_user_id       on public.goals(user_id);
create index idx_goals_month_year    on public.goals(month, year);
create index idx_session_techniques_session on public.session_techniques(session_id);
create index idx_profiles_gym_id     on public.profiles(gym_id);
