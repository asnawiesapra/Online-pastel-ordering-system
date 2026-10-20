-- ============================================================================
--  PATER ILIGAN — 005: create the admin account via SQL
--  Run AFTER schema.sql. Safe to re-run.
--
--  Creates (or resets) an admin user you can sign in with immediately:
--     email:    admin@pater.ph
--     password: PaterAdmin2026!
--
--  Change the email/password below if you like, then run the whole file.
--  Passwords are stored the way Supabase Auth expects (bcrypt via pgcrypto).
-- ============================================================================

do $$
declare
  v_email    text := 'admin@pater.ph';        -- << change if you want
  v_password text := 'PaterAdmin2026!';       -- << change if you want
  v_name     text := 'Pater Admin';
  v_uid      uuid;
begin
  -- 1. Reuse the user if this email already exists, otherwise create one.
  select id into v_uid from auth.users where lower(email) = lower(v_email);

  if v_uid is null then
    v_uid := gen_random_uuid();

    insert into auth.users (
      instance_id, id, aud, role, email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000',
      v_uid,
      'authenticated',
      'authenticated',
      v_email,
      crypt(v_password, gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', v_name, 'role', 'admin'),
      now(), now(),
      '', '', '', ''
    );

    -- Email identity so password sign-in works.
    insert into auth.identities (
      id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(),
      v_uid,
      v_uid::text,
      'email',
      jsonb_build_object('sub', v_uid::text, 'email', v_email, 'email_verified', true),
      now(), now(), now()
    )
    on conflict do nothing;
  else
    -- Reset the password + make sure it's confirmed and hashed correctly.
    update auth.users
       set encrypted_password = crypt(v_password, gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()),
           updated_at         = now()
     where id = v_uid;

    -- Make sure an email identity exists for this user (older users may lack one).
    insert into auth.identities (
      id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(),
      v_uid,
      v_uid::text,
      'email',
      jsonb_build_object('sub', v_uid::text, 'email', v_email, 'email_verified', true),
      now(), now(), now()
    )
    on conflict do nothing;
  end if;

  -- 3. Normalise the token/text columns the Auth service reads. GoTrue cannot
  --    scan NULL into a string, so these must be empty strings (not NULL) or
  --    sign-in fails with "converting NULL to string is unsupported".
  update auth.users
     set confirmation_token        = coalesce(confirmation_token, ''),
         recovery_token            = coalesce(recovery_token, ''),
         email_change              = coalesce(email_change, ''),
         email_change_token_new    = coalesce(email_change_token_new, ''),
         email_change_token_current = coalesce(email_change_token_current, ''),
         phone_change              = coalesce(phone_change, ''),
         phone_change_token        = coalesce(phone_change_token, ''),
         reauthentication_token    = coalesce(reauthentication_token, '')
   where id = v_uid;

  -- 4. Ensure the profile exists and is an admin.
  insert into public.profiles (id, email, full_name, role)
  values (v_uid, v_email, v_name, 'admin')
  on conflict (id) do update
    set email = excluded.email,
        role  = 'admin';
end $$;
