-- Replace the placeholder with the existing Auth user's actual UUID.
insert into public.staff_roles (user_id, role)
values ('REPLACE_WITH_AUTH_UUID'::uuid, 'admin');
