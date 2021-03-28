ALTER TABLE tenant.identity_provider
    ALTER disabled_at TYPE TIMESTAMPTZ;

ALTER TABLE tenant.api_key
    ALTER disabled_at TYPE TIMESTAMPTZ,
    ALTER created_at TYPE TIMESTAMPTZ,
    ALTER expires_at TYPE TIMESTAMPTZ;

ALTER TABLE tenant.identity
	ALTER created_at TYPE TIMESTAMPTZ;

ALTER TABLE tenant.person
	ALTER otp_activated_at TYPE TIMESTAMPTZ;

ALTER TABLE tenant.person_password_reset
	ALTER expires_at TYPE TIMESTAMPTZ,
	ALTER created_at TYPE TIMESTAMPTZ,
	ALTER used_at TYPE TIMESTAMPTZ;

