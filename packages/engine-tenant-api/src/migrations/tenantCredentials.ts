import { escapeValue, MigrationBuilder } from '@contember/database-migrations'
import { TenantMigrationArgs } from './types'

export const createCredentials = async (builder: MigrationBuilder, args: TenantMigrationArgs) => {
	const credentials = await args.getCredentials()
	if (credentials.loginTokenHash) {
		const tokenHash = credentials.loginTokenHash
		builder.sql(`
			WITH identity AS (
			    INSERT INTO identity(id, parent_id, roles, description, created_at)
				VALUES (${escapeValue(args.providers.uuid())}, NULL, '["login"]'::JSONB, 'Login key', now()) RETURNING id
			)
			INSERT INTO api_key (id, token_hash, type, identity_id, disabled_at, expires_at, expiration, created_at)
			SELECT ${escapeValue(args.providers.uuid())}, ${escapeValue(tokenHash)}, 'permanent', identity.id, NULL, NULL, NULL, now()
			FROM identity
			`)
	}

	if (!credentials.rootTokenHash) {
		throw 'Please specify a root token using CONTEMBER_ROOT_TOKEN env variable.'
	}

	if (credentials.rootEmail && !credentials.rootPasswordBcrypted) {
		throw 'Please specify a root password using CONTEMBER_ROOT_PASSWORD env variable.'
	}
	const rootEmail = credentials.rootPasswordBcrypted ? credentials.rootEmail || 'root@localhost' : null
	const rootPasswordHash = credentials.rootPasswordBcrypted || null

	const rootTokenHash = credentials.rootTokenHash

	builder.sql(`
			WITH identity AS (
				INSERT INTO identity(id, parent_id, roles, description, created_at)
				VALUES (
						   ${escapeValue(args.providers.uuid())},
						NULL,
						'["super_admin"]'::JSONB
							|| (CASE WHEN ${escapeValue(rootEmail)} IS NOT NULL THEN '["person"]'::JSONB ELSE '[]'::JSONB END),
						'Superadmin',
						now()
					) RETURNING id
			),
			person AS (
				INSERT INTO person(id, email, password_hash, identity_id)
				SELECT ${escapeValue(args.providers.uuid())}, ${escapeValue(rootEmail)}, ${escapeValue(rootPasswordHash)}, identity.id
				FROM identity
				WHERE ${escapeValue(rootEmail)} IS NOT NULL
			    RETURNING id
			),
			api_key AS (
				INSERT INTO api_key (id, token_hash, type, identity_id, disabled_at, expires_at, expiration, created_at)
				SELECT ${escapeValue(args.providers.uuid())}, ${escapeValue(rootTokenHash)}, 'permanent', identity.id, NULL, NULL, NULL, now()
				FROM identity WHERE ${escapeValue(rootTokenHash)} IS NOT NULL
			    RETURNING id
			)
			SELECT * FROM person, api_key
		`)
}
