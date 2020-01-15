DO
$BLOCK$
    BEGIN
        IF NOT EXISTS(
          SELECT
          FROM pg_proc
                   JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
          WHERE pg_namespace.nspname = 'tenant' AND pg_proc.proname = 'uuid_generate_v4'
            ) THEN
            CREATE FUNCTION "tenant"."uuid_generate_v4"() RETURNS UUID
            AS
            $$
            SELECT OVERLAY(OVERLAY(md5(random()::TEXT || ':' || clock_timestamp()::TEXT) PLACING '4' FROM 13) PLACING
                           to_hex(floor(random() * (11 - 8 + 1) + 8)::INT)::TEXT FROM 17)::UUID;
            $$ LANGUAGE SQL;
            END IF;
    END
$BLOCK$;

WITH identity AS (
  INSERT INTO "tenant"."identity" (id, parent_id, roles)
  VALUES (
    tenant.uuid_generate_v4(),
    null,
    '["setup"]'
  )
  returning id
)
INSERT INTO "tenant"."api_key" (id, token_hash, type, identity_id, enabled, expires_at, created_at)
  select
    tenant.uuid_generate_v4(),
    '081115df5d291465362f17c4b7b182da6aaa6d8147a0fec1aca8435eec404612',
    'one_off',
    identity.id,
    true,
    null,
    now()
  from identity
