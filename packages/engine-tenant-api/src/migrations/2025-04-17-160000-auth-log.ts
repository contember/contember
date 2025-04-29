import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
CREATE TYPE auth_log_type AS ENUM (
  'login',
  'create_session_token',
  'idp_login',
  'password_reset_init',
  'password_reset',
  'password_change',
  'email_change',
  '2fa_disable',
  '2fa_enable',
  'passwordless_login_init',
  'passwordless_login_exchange',
  'passwordless_login',
  'person_disable'
);

CREATE TABLE person_auth_log (
  id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  invoked_by_id UUID REFERENCES identity(id) ON DELETE SET NULL,
  person_id UUID REFERENCES person(id) ON DELETE SET NULL,
  person_token_id UUID REFERENCES person_token(id) ON DELETE SET NULL,
  person_input_identifier TEXT DEFAULT NULL,
  type auth_log_type NOT NULL,
  success BOOLEAN NOT NULL,
  error_code TEXT,
  error_message TEXT,
  ip_address INET,
  user_agent TEXT,
  identity_provider_id UUID REFERENCES identity_provider(id) ON DELETE SET NULL,
  metadata JSONB
);
CREATE INDEX ON person_auth_log (person_input_identifier, created_at DESC)
	WHERE type = 'login' AND success = FALSE;

CREATE INDEX ON person_auth_log (person_id, created_at DESC);
                                                     
`

export default async function (builder: MigrationBuilder) {
	builder.sql(sql)
}
