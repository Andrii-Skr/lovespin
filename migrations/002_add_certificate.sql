alter table love_pages
  alter column photo_path drop not null;

alter table love_pages
  add column if not exists certificate_path text,
  add column if not exists certificate_name varchar(255);

alter table love_pages
  add constraint love_pages_certificate_pair_check
  check ((certificate_path is null) = (certificate_name is null));

alter table love_pages
  add constraint love_pages_has_attachment_check
  check (
    (photo_path is not null and certificate_path is null)
    or (photo_path is null and certificate_path is not null)
  );
