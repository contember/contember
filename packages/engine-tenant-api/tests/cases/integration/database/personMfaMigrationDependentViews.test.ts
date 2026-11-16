import { expect, test } from 'bun:test'
import crypto from 'node:crypto'
import { Connection, wrapIdentifier } from '@contember/database'
import { createMigrationBuilder } from '@contember/database-migrations'
import migration from '../../../../src/migrations/2026-05-21-100000-person-mfa.js'
import { createConnection } from '../../../src/dbUtils.js'

const databaseName = process.env.TEST_DB_NAME ?? ''

const databaseConfigured = Boolean(
	process.env.TEST_DB_HOST
		&& process.env.TEST_DB_PORT
		&& process.env.TEST_DB_USER
		&& process.env.TEST_DB_PASSWORD
		&& databaseName,
)

type Step = (trx: Connection.TransactionLike, tenantSchema: string) => Promise<void>

/**
 * Runs the migration against a scratch tenant schema holding the pre-migration person table: `prepare` creates the
 * project's own objects first, `verify` inspects the result. Everything runs in one transaction that is always rolled back.
 */
const runMigration = async (prepare: Step, verify: Step = async () => {}): Promise<void> => {
	const suffix = crypto.randomUUID().replaceAll('-', '').slice(0, 12)
	const tenantSchema = wrapIdentifier(`mfa_views_tenant_${suffix}`)
	const connection = createConnection(databaseName)
	try {
		await connection.transaction(async trx => {
			try {
				await trx.query(`CREATE SCHEMA ${tenantSchema}`)
				await trx.query(`SET LOCAL search_path TO ${tenantSchema}`)
				await trx.query(`
					CREATE TABLE person (
						id UUID PRIMARY KEY,
						email TEXT,
						otp_uri TEXT,
						otp_activated_at TIMESTAMPTZ
					)
				`)
				await trx.query(`INSERT INTO person (id, email, otp_uri, otp_activated_at) VALUES (?, ?, ?, now())`, [
					crypto.randomUUID(),
					'mfa@example.com',
					'otpauth://totp/test?secret=ABC',
				])
				await prepare(trx, tenantSchema)

				const builder = createMigrationBuilder()
				await migration(builder, {
					connection: trx,
					getCredentials: async () => ({}),
					providers: { uuid: () => crypto.randomUUID() },
				})
				for (const sql of builder.getSqlSteps()) {
					await trx.query(sql)
				}
				await verify(trx, tenantSchema)
			} finally {
				await trx.rollback()
			}
		})
	} finally {
		await connection.end()
	}
}

test.skipIf(!databaseConfigured)('the migration refuses to run while outside views read the dropped columns, naming each view', async () => {
	let error: unknown = null
	try {
		await runMigration(async (trx, tenantSchema) => {
			await trx.query('CREATE SCHEMA "mfa views project"')
			await trx.query(`CREATE VIEW "mfa views project"."person_otp" AS SELECT id, otp_uri FROM ${tenantSchema}.person`)
			await trx.query(`CREATE MATERIALIZED VIEW "mfa views project"."person_otp_since" AS SELECT id, otp_activated_at FROM ${tenantSchema}.person`)
			await trx.query(`CREATE VIEW "mfa views project"."person_email" AS SELECT id, email FROM ${tenantSchema}.person`)
		})
	} catch (e) {
		error = e
	}
	expect(error).toBeInstanceOf(Error)
	const message = error instanceof Error ? error.message : ''
	expect(message).toContain('"mfa views project"."person_otp"')
	expect(message).toContain('"mfa views project"."person_otp_since"')
	expect(message).not.toContain('person_email')
	expect(message).toContain('Drop these views, or rewrite them')
})

test.skipIf(!databaseConfigured)('the migration moves the TOTP factor and drops the columns when no outside view reads them', async () => {
	await runMigration(async (trx, tenantSchema) => {
		await trx.query('CREATE SCHEMA "mfa views project"')
		await trx.query(`CREATE VIEW "mfa views project"."person_email" AS SELECT id, email FROM ${tenantSchema}.person`)
	}, async (trx, tenantSchema) => {
		const factors = await trx.query<{ secret: string; version: number; activated: boolean }>(
			`SELECT convert_from(totp_secret, 'UTF8') AS secret, totp_secret_version AS version, totp_activated_at IS NOT NULL AS activated
			FROM ${tenantSchema}.person_mfa`,
		)
		expect(factors.rows).toEqual([{ secret: 'otpauth://totp/test?secret=ABC', version: 0, activated: true }])
		const columns = await trx.query<{ name: string }>(
			`SELECT attname AS name FROM pg_attribute WHERE attrelid = ?::regclass AND attnum > 0 AND NOT attisdropped ORDER BY attnum`,
			[`${tenantSchema}.person`],
		)
		expect(columns.rows.map(it => it.name)).toEqual(['id', 'email'])
	})
})
