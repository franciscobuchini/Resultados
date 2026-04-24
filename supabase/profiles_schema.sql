-- 1. Crear la tabla profiles
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  user_name text unique not null,
  user_team_id text references public.teams(team_id) on delete set null,
  user_plan text default 'free' check (user_plan in ('free', 'pro', 'admin')),
  user_province text,
  user_city text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Configurar Row Level Security (RLS)
alter table public.profiles enable row level security;

-- Cualquiera puede ver los perfiles (útil si hay foros o comentarios en el futuro)
-- Si prefieres que sean privados, puedes cambiar esto a: auth.uid() = id
create policy "Los perfiles son visibles por todos" on profiles
  for select using (true);

-- Los usuarios solo pueden actualizar su propio perfil
create policy "Usuarios pueden actualizar su propio perfil" on profiles
  for update using (auth.uid() = id);

-- 3. Crear función y trigger para registrar el perfil automáticamente
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- Supabase permite enviar metadata extra al registrarse (ej. user_name)
  insert into public.profiles (id, user_name, user_plan)
  values (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'user_name', 'user_' || substr(new.id::text, 1, 8)), 
    'free'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
