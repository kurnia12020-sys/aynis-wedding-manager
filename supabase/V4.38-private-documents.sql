-- Run once in Supabase SQL editor before using document uploads.
-- Private bucket; RLS only grants active owner/admin of matching workspace prefix.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('wedding-documents','wedding-documents',false,5242880,array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do update set public=false,file_size_limit=5242880,allowed_mime_types=excluded.allowed_mime_types;

create policy "aynis_documents_read" on storage.objects for select to authenticated
using (bucket_id='wedding-documents' and exists (
 select 1 from public.workspace_members wm
 where wm.user_id=auth.uid() and wm.status='active'
 and wm.role in ('owner','admin') and wm.workspace_id::text = split_part(name,'/',1)
));
create policy "aynis_documents_insert" on storage.objects for insert to authenticated
with check (bucket_id='wedding-documents' and exists (
 select 1 from public.workspace_members wm
 where wm.user_id=auth.uid() and wm.status='active'
 and wm.role in ('owner','admin') and wm.workspace_id::text=split_part(name,'/',1)
));
create policy "aynis_documents_delete" on storage.objects for delete to authenticated
using (bucket_id='wedding-documents' and exists (
 select 1 from public.workspace_members wm
 where wm.user_id=auth.uid() and wm.status='active'
 and wm.role in ('owner','admin') and wm.workspace_id::text=split_part(name,'/',1)
));
