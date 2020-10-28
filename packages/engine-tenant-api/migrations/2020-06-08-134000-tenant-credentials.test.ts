import migration from './2020-06-08-134000-tenant-credentials'
import { createMigrationBuilder } from '@contember/database-migrations'
import { suite } from 'uvu'
import * as assert from 'uvu/assert'

const credentialsMigrationTest = suite('credentials migration ')
credentialsMigrationTest('generate sql with login token', async () => {
	const builder = createMigrationBuilder()
	await migration(builder, {
		providers: {
			bcrypt: val => Promise.resolve(`${val}-bcrypted`),
		},
		credentials: {
			loginToken: 'helloworld',
		},
	})
	assert.equal(
		builder.getSql(),
		`
			WITH identity AS (
			    INSERT INTO tenant.identity(id, parent_id, roles, description, created_at)
				VALUES ("tenant"."uuid_generate_v4"(), NULL, '["login"]'::JSONB, 'Login key', now()) RETURNING id
			)
			INSERT INTO tenant.api_key (id, token_hash, type, identity_id, disabled_at, expires_at, expiration, created_at)
			SELECT "tenant"."uuid_generate_v4"(), $pg1$936a185caaa266bb9cbe981e9e05cb78cd732b0b3280eb944412bb6f8f8f07af$pg1$, 'permanent', identity.id, NULL, NULL, NULL, now()
			FROM identity
			;
`,
	)
})

credentialsMigrationTest('generate sql with root token', async () => {
	const builder = createMigrationBuilder()
	await migration(builder, {
		providers: {
			bcrypt: val => Promise.resolve(`${val}-bcrypted`),
		},
		credentials: {
			rootToken: 'foobar',
		},
	})
	assert.equal(
		builder.getSql(),
		`
			WITH identity AS (
				INSERT INTO tenant.identity(id, parent_id, roles, description, created_at)
				VALUES (
						"tenant"."uuid_generate_v4"(),
						NULL,
						'["super_admin"]'::JSONB
							|| (CASE WHEN NULL IS NOT NULL THEN '["person"]'::JSONB ELSE '[]'::JSONB END),
						'Superadmin',
						now()
					) RETURNING id
			),
			person AS (
				INSERT INTO tenant.person(id, email, password_hash, identity_id)
				SELECT "tenant"."uuid_generate_v4"(), NULL, NULL, identity.id
				FROM identity
				WHERE NULL IS NOT NULL
			    RETURNING id
			),
			api_key AS (
				INSERT INTO tenant.api_key (id, token_hash, type, identity_id, disabled_at, expires_at, expiration, created_at)
				SELECT "tenant"."uuid_generate_v4"(), $pg1$c3ab8ff13720e8ad9047dd39466b3c8974e592c2fa383d4a3960714caef0c4f2$pg1$, 'permanent', identity.id, NULL, NULL, NULL, now()
				FROM identity WHERE $pg1$c3ab8ff13720e8ad9047dd39466b3c8974e592c2fa383d4a3960714caef0c4f2$pg1$ IS NOT NULL
			    RETURNING id
			)
			SELECT * FROM person, api_key
		;
UPDATE "tenant"."api_key"
	         SET "disabled_at" = now()
	         WHERE "token_hash" = '081115df5d291465362f17c4b7b182da6aaa6d8147a0fec1aca8435eec404612'
	               AND "disabled_at" IS NULL;
`,
	)
})

credentialsMigrationTest('generate sql with root user', async () => {
	const builder = createMigrationBuilder()
	await migration(builder, {
		providers: {
			bcrypt: val => Promise.resolve(`${val}-bcrypted`),
		},
		credentials: {
			rootPassword: 'foobar',
		},
	})
	assert.equal(
		builder.getSql(),
		`
			WITH identity AS (
				INSERT INTO tenant.identity(id, parent_id, roles, description, created_at)
				VALUES (
						"tenant"."uuid_generate_v4"(),
						NULL,
						'["super_admin"]'::JSONB
							|| (CASE WHEN $pg1$root@localhost$pg1$ IS NOT NULL THEN '["person"]'::JSONB ELSE '[]'::JSONB END),
						'Superadmin',
						now()
					) RETURNING id
			),
			person AS (
				INSERT INTO tenant.person(id, email, password_hash, identity_id)
				SELECT "tenant"."uuid_generate_v4"(), $pg1$root@localhost$pg1$, $pg1$foobar-bcrypted$pg1$, identity.id
				FROM identity
				WHERE $pg1$root@localhost$pg1$ IS NOT NULL
			    RETURNING id
			),
			api_key AS (
				INSERT INTO tenant.api_key (id, token_hash, type, identity_id, disabled_at, expires_at, expiration, created_at)
				SELECT "tenant"."uuid_generate_v4"(), NULL, 'permanent', identity.id, NULL, NULL, NULL, now()
				FROM identity WHERE NULL IS NOT NULL
			    RETURNING id
			)
			SELECT * FROM person, api_key
		;
UPDATE "tenant"."api_key"
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
				INSERT INTO tenant.identity(id, parent_id, roles, description, created_at)
				VALUES (
						"tenant"."uuid_generate_v4"(),
						NULL,
						'["super_admin"]'::JSONB
							|| (CASE WHEN $pg1$john@doe.com$pg1$ IS NOT NULL THEN '["person"]'::JSONB ELSE '[]'::JSONB END),
						'Superadmin',
						now()
					) RETURNING id
			),
			person AS (
				INSERT INTO tenant.person(id, email, password_hash, identity_id)
				SELECT "tenant"."uuid_generate_v4"(), $pg1$john@doe.com$pg1$, $pg1$pwd-bcrypted$pg1$, identity.id
				FROM identity
				WHERE $pg1$john@doe.com$pg1$ IS NOT NULL
			    RETURNING id
			),
			api_key AS (
				INSERT INTO tenant.api_key (id, token_hash, type, identity_id, disabled_at, expires_at, expiration, created_at)
				SELECT "tenant"."uuid_generate_v4"(), $pg1$d96f62ea0f2f543aa7822a58114f75dbcc05bdf970fb15eb55eea836a1439e43$pg1$, 'permanent', identity.id, NULL, NULL, NULL, now()
				FROM identity WHERE $pg1$d96f62ea0f2f543aa7822a58114f75dbcc05bdf970fb15eb55eea836a1439e43$pg1$ IS NOT NULL
			    RETURNING id
			)
			SELECT * FROM person, api_key
		;
UPDATE "tenant"."api_key"
	         SET "disabled_at" = now()
	         WHERE "token_hash" = '081115df5d291465362f17c4b7b182da6aaa6d8147a0fec1aca8435eec404612'
	               AND "disabled_at" IS NULL;
`,
	)
})
credentialsMigrationTest.run()
