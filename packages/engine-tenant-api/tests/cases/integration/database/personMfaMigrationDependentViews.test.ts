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

type Step = (trx: Connection.TransactionLike, schemas: { tenant: string; project: string }) => Promise<void>

/**
 * Runs the migration against a scratch tenant schema holding the pre-migration person table: `prepare` creates the
 * project's own objects first, `verify` inspects the result. Everything runs in one transaction that is always rolled back.
 */
const runMigration = async (prepare: Step, verify: Step = async () => {}): Promise<void> => {
	const suffix = crypto.randomUUID().replaceAll('-', '').slice(0, 12)
	const schemas = { tenant: wrapIdentifier(`mfa_views_tenant_${suffix}`), project: wrapIdentifier(`mfa views project ${suffix}`) }
	const connection = createConnection(databaseName)
	try {
		await connection.transaction(async trx => {
			try {
				await trx.query(`CREATE SCHEMA ${schemas.tenant}`)
				await trx.query(`CREATE SCHEMA ${schemas.project}`)
				await trx.query(`SET LOCAL search_path TO ${schemas.tenant}`)
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
				await prepare(trx, schemas)

				const builder = createMigrationBuilder()
				await migration(builder, {
					connection: trx,
					getCredentials: async () => ({}),
					providers: { uuid: () => crypto.randomUUID() },
				})
				for (const sql of builder.getSqlSteps()) {
					await trx.query(sql)
				}
				await verify(trx, schemas)
			} finally {
				await trx.rollback()
			}
		})
	} finally {
		await connection.end()
	}
}

test.skipIf(!databaseConfigured)('the migration refuses to run while outside objects read the dropped columns, naming each one', async () => {
	let projectSchema = ''
	let error: unknown = null
	try {
		await runMigration(async (trx, { tenant, project }) => {
			projectSchema = project
			await trx.query(`CREATE VIEW ${project}."person_otp" AS SELECT id, otp_uri FROM ${tenant}.person`)
			await trx.query(`CREATE MATERIALIZED VIEW ${project}."person_otp_since" AS SELECT id, otp_activated_at FROM ${tenant}.person`)
			await trx.query(`CREATE VIEW ${project}."person_email" AS SELECT id, email FROM ${tenant}.person`)
			await trx.query(`CREATE TABLE ${project}."audit" (id UUID)`)
			await trx.query(`CREATE RULE "copy_otp" AS ON INSERT TO ${project}."audit" DO ALSO SELECT otp_uri FROM ${tenant}.person`)
		})
	} catch (e) {
		error = e
	}
	expect(error).toBeInstanceOf(Error)
	const message = error instanceof Error ? error.message : ''
	const listed = message.match(/depend on them: (.*)\. Drop these objects/)?.[1].split(', ')
	expect(listed).toEqual([
		`materialized view ${projectSchema}.person_otp_since`,
		`rule copy_otp on table ${projectSchema}.audit`,
		`view ${projectSchema}.person_otp`,
	])
	expect(message).toContain('Drop these objects, or rewrite them')
})

test.skipIf(!databaseConfigured)('the migration moves the TOTP factor and drops the columns when no outside object reads them', async () => {
	await runMigration(async (trx, { tenant, project }) => {
		await trx.query(`CREATE VIEW ${project}."person_email" AS SELECT id, email FROM ${tenant}.person`)
	}, async (trx, { tenant }) => {
		const factors = await trx.query<{ secret: string; version: number; activated: boolean }>(
			`SELECT convert_from(totp_secret, 'UTF8') AS secret, totp_secret_version AS version, totp_activated_at IS NOT NULL AS activated
			FROM ${tenant}.person_mfa`,
		)
		expect(factors.rows).toEqual([{ secret: 'otpauth://totp/test?secret=ABC', version: 0, activated: true }])
		const columns = await trx.query<{ name: string }>(
			`SELECT attname AS name FROM pg_attribute WHERE attrelid = ?::regclass AND attnum > 0 AND NOT attisdropped ORDER BY attnum`,
			[`${tenant}.person`],
		)
		expect(columns.rows.map(it => it.name)).toEqual(['id', 'email'])
	})
})
