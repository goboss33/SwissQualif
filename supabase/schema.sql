-- Active l'extension UUID si pas déjà fait
create extension if not exists "uuid-ossp";

-- TABLE 1: AGENCIES (L'entité légale)
create table public.agencies (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamp with time zone default now()
);

-- TABLE 2: PROFILES (Liaison User Auth -> Agency)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  agency_id uuid references public.agencies(id),
  full_name text,
  role text default 'agent',
  created_at timestamp with time zone default now()
);

-- TABLE 3: PROPERTIES (Les biens)
create table public.properties (
  id uuid primary key default uuid_generate_v4(),
  agency_id uuid references public.agencies(id) not null,
  
  -- Infos de base
  reference text,
  status text default 'draft', -- draft, active, sold
  price_chf numeric,
  
  -- Adresse
  street text,
  zip_code text,
  city text,
  canton text,
  
  -- Technique
  rooms numeric, -- 3.5
  surface_living numeric,
  description_fr text,
  
  created_at timestamp with time zone default now()
);

-- TABLE 4: PROPERTY_IMAGES
create table public.property_images (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid references public.properties(id) on delete cascade,
  storage_path text not null, -- Chemin dans le bucket Supabase Storage
  position integer default 0
);

-- RLS (Row Level Security)
alter table public.properties enable row level security;
create policy "Users can view own agency properties" on public.properties for select using ( agency_id in (select agency_id from public.profiles where id = auth.uid()) );
create policy "Users can insert own agency properties" on public.properties for insert with check ( agency_id in (select agency_id from public.profiles where id = auth.uid()) );
create policy "Users can update own agency properties" on public.properties for update using ( agency_id in (select agency_id from public.profiles where id = auth.uid()) );
create policy "Users can delete own agency properties" on public.properties for delete using ( agency_id in (select agency_id from public.profiles where id = auth.uid()) );

-- TABLE 5: PORTALS_CONFIG
create table public.portals_config (
  id uuid primary key default uuid_generate_v4(),
  agency_id uuid references public.agencies(id) on delete cascade not null,
  portal_name text not null, -- 'homegate', 'immoscout24'
  ftp_host text,
  ftp_user text,
  ftp_password text,
  is_active boolean default false,
  created_at timestamp with time zone default now(),
  unique(agency_id, portal_name)
);

alter table public.portals_config enable row level security;
create policy "Users can view own agency portal config" on public.portals_config for select using ( agency_id in (select agency_id from public.profiles where id = auth.uid()) );
create policy "Users can insert own agency portal config" on public.portals_config for insert with check ( agency_id in (select agency_id from public.profiles where id = auth.uid()) );
create policy "Users can update own agency portal config" on public.portals_config for update using ( agency_id in (select agency_id from public.profiles where id = auth.uid()) );

alter table public.agencies enable row level security;
create policy "Users can view own agency" on public.agencies for select using ( id in (select agency_id from public.profiles where id = auth.uid()) );
create policy "Users can update own agency" on public.agencies for update using ( id in (select agency_id from public.profiles where id = auth.uid()) );
create policy "Any authenticated user can create an agency" on public.agencies for insert with check ( auth.role() = 'authenticated' );

alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles for select using ( id = auth.uid() );
create policy "Users can update own profile" on public.profiles for update using ( id = auth.uid() );

alter table public.property_images enable row level security;
create policy "Users can manage own agency images" on public.property_images 
  for all using ( property_id in (select id from public.properties) );

-- AUTOMATION: PROFILE CREATION ON SIGNUP
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
