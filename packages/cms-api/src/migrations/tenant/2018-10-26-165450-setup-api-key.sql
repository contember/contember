CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA "tenant";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" SCHEMA "tenant";
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
    encode(tenant.digest('12345123451234512345', 'sha256'), 'hex'),
    'one_off',
    identity.id,
    true,
    null,
    now()
  from identity
