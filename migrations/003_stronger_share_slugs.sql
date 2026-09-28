alter table love_pages
  alter column slug type varchar(32);

alter table love_pages
  drop constraint if exists love_pages_slug_check;

alter table love_pages
  add constraint love_pages_slug_check
  check (slug ~ '^([a-z0-9]{12}|[a-f0-9]{32})$');
