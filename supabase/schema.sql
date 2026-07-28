create table if not exists public.seteuk_records (
  id uuid primary key default gen_random_uuid(),
  student_id text not null,
  grade text not null,
  subject text not null,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.seteuk_records enable row level security;
create policy "allow anon read records" on public.seteuk_records for select to anon using (true);
create policy "allow anon insert records" on public.seteuk_records for insert to anon with check (true);
