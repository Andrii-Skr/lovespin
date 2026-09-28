create table if not exists love_pages (
  id uuid primary key default gen_random_uuid(),
  slug varchar(12) not null unique check (slug ~ '^[a-z0-9]{12}$'),
  recipient_name varchar(50) not null,
  intro_text varchar(160) not null,
  compliment_one varchar(160) not null,
  compliment_two varchar(160) not null,
  prize_title varchar(80) not null,
  prize_message varchar(240) not null,
  sender_name varchar(50) not null,
  photo_path text not null,
  owner_id uuid null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  check (expires_at > created_at)
);

create index if not exists love_pages_expires_at_idx on love_pages (expires_at);

create table if not exists publish_events (
  id bigserial primary key,
  ip_hash char(64) not null,
  created_at timestamptz not null default now()
);

create index if not exists publish_events_ip_created_idx
  on publish_events (ip_hash, created_at desc);
