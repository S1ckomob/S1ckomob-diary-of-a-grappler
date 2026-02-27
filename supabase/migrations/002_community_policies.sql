-- ============================================================
-- Community — Allow gym members to see each other
-- ============================================================

-- Gym members can view profiles of other members in the same gym
create policy "Gym members can view fellow members"
  on public.profiles for select
  to authenticated
  using (
    gym_id is not null
    and gym_id in (
      select p.gym_id from public.profiles p where p.id = auth.uid()
    )
  );

-- Gym members can view sessions of other members in the same gym
-- (enables activity feed and leaderboard)
create policy "Gym members can view fellow member sessions"
  on public.sessions for select
  to authenticated
  using (
    user_id in (
      select p.id from public.profiles p
      where p.gym_id is not null
        and p.gym_id in (
          select p2.gym_id from public.profiles p2 where p2.id = auth.uid()
        )
    )
  );
