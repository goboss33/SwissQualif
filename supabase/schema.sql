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

create policy "Users can view own agency properties"
  on public.properties for select
  using ( agency_id in (select agency_id from public.profiles where id = auth.uid()) );

create policy "Users can insert own agency properties"
  on public.properties for insert
  with check ( agency_id in (select agency_id from public.profiles where id = auth.uid()) );

create policy "Users can update own agency properties"
  on public.properties for update
  using ( agency_id in (select agency_id from public.profiles where id = auth.uid()) );

create policy "Users can delete own agency properties"
  on public.properties for delete
  using ( agency_id in (select agency_id from public.profiles where id = auth.uid()) );
