-- technique_notes: personal notes per user per technique
create table if not exists technique_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  technique_id uuid not null references techniques(id) on delete cascade,
  notes text,
  updated_at timestamptz not null default now(),
  unique (user_id, technique_id)
);

-- Indexes
create index idx_technique_notes_user on technique_notes(user_id);
create index idx_technique_notes_technique on technique_notes(technique_id);
create index idx_technique_notes_composite on technique_notes(user_id, technique_id);

-- RLS
alter table technique_notes enable row level security;

create policy "Users can view own notes"
  on technique_notes for select
  using (auth.uid() = user_id);

create policy "Users can insert own notes"
  on technique_notes for insert
  with check (auth.uid() = user_id);

create policy "Users can update own notes"
  on technique_notes for update
  using (auth.uid() = user_id);

create policy "Users can delete own notes"
  on technique_notes for delete
  using (auth.uid() = user_id);
