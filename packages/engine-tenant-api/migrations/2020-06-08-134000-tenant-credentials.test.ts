import migration from './2020-06-08-134000-tenant-credentials'
import { createMigrationBuilder } from '@contember/database-migrations'
import { suite } from 'uvu'
import * as assert from 'uvu/assert'

const credentialsMigrationTest = suite('credentials migration ')

credentialsMigrationTest('generate sql with root token and login token', async () => {
	const builder = createMigrationBuilder()
	await migration(builder, {
		providers: {
			bcrypt: val => Promise.resolve(`${val}-bcrypted`),
		},
		credentials: {
			loginToken: 'helloworld',
			rootToken: 'foobar',
		},
	})
	assert.equal(
		builder.getSql(),
		`
			WITH identity AS (
			    INSERT INTO identity(id, parent_id, roles, description, created_at)
				VALUES (public."uuid_generate_v4"(), NULL, '["login"]'::JSONB, 'Login key', now()) RETURNING id
			)
			INSERT INTO api_key (id, token_hash, type, identity_id, disabled_at, expires_at, expiration, created_at)
			SELECT public."uuid_generate_v4"(), $pga$936a185caaa266bb9cbe981e9e05cb78cd732b0b3280eb944412bb6f8f8f07af$pga$, 'permanent', identity.id, NULL, NULL, NULL, now()
			FROM identity
			;

			WITH identity AS (
				INSERT INTO identity(id, parent_id, roles, description, created_at)
				VALUES (
						public."uuid_generate_v4"(),
						NULL,
						'["super_admin"]'::JSONB
							|| (CASE WHEN NULL IS NOT NULL THEN '["person"]'::JSONB ELSE '[]'::JSONB END),
						'Superadmin',
						now()
					) RETURNING id
			),
			person AS (
				INSERT INTO person(id, email, password_hash, identity_id)
				SELECT public."uuid_generate_v4"(), NULL, NULL, identity.id
				FROM identity
				WHERE NULL IS NOT NULL
			    RETURNING id
			),
			api_key AS (
				INSERT INTO api_key (id, token_hash, type, identity_id, disabled_at, expires_at, expiration, created_at)
				SELECT public."uuid_generate_v4"(), $pga$c3ab8ff13720e8ad9047dd39466b3c8974e592c2fa383d4a3960714caef0c4f2$pga$, 'permanent', identity.id, NULL, NULL, NULL, now()
				FROM identity WHERE $pga$c3ab8ff13720e8ad9047dd39466b3c8974e592c2fa383d4a3960714caef0c4f2$pga$ IS NOT NULL
			    RETURNING id
			)
			SELECT * FROM person, api_key
		;
UPDATE "api_key"
	         SET "disabled_at" = now()
	         WHERE "token_hash" = '081115df5d291465362f17c4b7b182da6aaa6d8147a0fec1aca8435eec404612'
	               AND "disabled_at" IS NULL;
`,
	)
})

credentialsMigrationTest('generate sql with both root user and token', async () => {
	const builder = createMigrationBuilder()
	await migration(builder, {
		providers: {
			bcrypt: val => Promise.resolve(`${val}-bcrypted`),
		},
		credentials: {
			rootPassword: 'pwd',
			rootToken: 'tkn',
			rootEmail: 'john@doe.com',
		},
	})
	assert.equal(
		builder.getSql(),
		`
			WITH identity AS (
				INSERT INTO identity(id, parent_id, roles, description, created_at)
				VALUES (
						public."uuid_generate_v4"(),
						NULL,
						'["super_admin"]'::JSONB
							|| (CASE WHEN $pga$john@doe.com$pga$ IS NOT NULL THEN '["person"]'::JSONB ELSE '[]'::JSONB END),
						'Superadmin',
						now()
					) RETURNING id
			),
			person AS (
				INSERT INTO person(id, email, password_hash, identity_id)
				SELECT public."uuid_generate_v4"(), $pga$john@doe.com$pga$, $pga$pwd-bcrypted$pga$, identity.id
				FROM identity
				WHERE $pga$john@doe.com$pga$ IS NOT NULL
			    RETURNING id
			),
			api_key AS (
				INSERT INTO api_key (id, token_hash, type, identity_id, disabled_at, expires_at, expiration, created_at)
				SELECT public."uuid_generate_v4"(), $pga$d96f62ea0f2f543aa7822a58114f75dbcc05bdf970fb15eb55eea836a1439e43$pga$, 'permanent', identity.id, NULL, NULL, NULL, now()
				FROM identity WHERE $pga$d96f62ea0f2f543aa7822a58114f75dbcc05bdf970fb15eb55eea836a1439e43$pga$ IS NOT NULL
			    RETURNING id
			)
			SELECT * FROM person, api_key
		;
UPDATE "api_key"
	         SET "disabled_at" = now()
	         WHERE "token_hash" = '081115df5d291465362f17c4b7b182da6aaa6d8147a0fec1aca8435eec404612'
	               AND "disabled_at" IS NULL;
`,
	)
})
credentialsMigrationTest.run()
