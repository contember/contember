import { describe, expect, mock, test } from 'bun:test'
import crypto from 'node:crypto'
import { createConnectionMock, ExpectedQuery } from '@contember/database-tester'
import { BackupCodeManager, DatabaseContext, PersonRow, Providers, UserMailer } from "../../../src/index.js"

const NOW = new Date('2026-05-20T12:00:00.000Z')
const PERSON_ID = '123e4567-e89b-12d3-a456-000000000001'

const sha256 = (value: string) => crypto.createHash('sha256').update(value, 'ascii').digest('hex')

/**
 * Deterministic randomBytes so the generated codes (and therefore their hashes)
 * are predictable: byte i = i, so each code maps to a fixed sequence of letters.
 */
const sequentialBytes = (length: number): Promise<Buffer> => {
	const buf = Buffer.alloc(length)
	for (let i = 0; i < length; i++) {
		buf[i] = i
	}
	return Promise.resolve(buf)
}

const baseProviders = (overrides: Partial<Providers> = {}): Providers => ({
	bcrypt: () => Promise.resolve('x'),
	bcryptCompare: () => Promise.resolve(true),
	now: () => NOW,
	randomBytes: sequentialBytes,
	uuid: (() => {
		let i = 0
		return () => `uuid-${i++}`
	})(),
	decrypt: () => {
		throw new Error('not supported')
	},
	encrypt: () => {
		throw new Error('not supported')
	},
	encryptionEnabled: false,
	hash: value => Buffer.from(value.toString()),
	...overrides,
})

const makeDb = (queries: ExpectedQuery[], providers: Providers) => {
	const connection = createConnectionMock(queries)
	const client = connection.createClient('tenant', { module: 'tenant' })
	return new DatabaseContext(client, providers)
}

const PERSON_EMAIL = 'person@example.com'

const person = (overrides: Partial<PersonRow> = {}): PersonRow => ({
	id: PERSON_ID,
	password_hash: 'x',
	identity_id: 'identity-1',
	otp_secret: null,
	otp_secret_version: null,
	otp_activated_at: null,
	otp_pending_secret: null,
	otp_pending_version: null,
	otp_pending_created_at: null,
	email_otp_enabled: false,
	email: PERSON_EMAIL,
	name: null,
	roles: [],
	disabled_at: null,
	passwordless_enabled: null,
	mfa_grace_until: null,
	...overrides,
})

/** A UserMailer test double exposing only the method BackupCodeManager calls. */
const makeMailer = (impl?: UserMailer['sendBackupCodesExhaustedEmail']) => {
	const sendBackupCodesExhaustedEmail = mock<UserMailer['sendBackupCodesExhaustedEmail']>(impl ?? (() => Promise.resolve()))
	const mailer = { sendBackupCodesExhaustedEmail } as unknown as UserMailer
	return { mailer, sendBackupCodesExhaustedEmail }
}

// SELECT issued by countUnused after a successful consume.
const COUNT_UNUSED_SQL = `select count(*)::text as count from "tenant"."person_backup_code" where "person_id" = ? and "used_at" is null`
const countUnusedSql = (count: number): ExpectedQuery => ({
	sql: COUNT_UNUSED_SQL,
	parameters: [PERSON_ID],
	response: { rows: [{ count: String(count) }] },
})

const ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789'
// With sequentialBytes, byte i = i, so char i = ALPHABET[i % 32].
const expectedRaw = Array.from({ length: 10 }, (_, i) => ALPHABET[i % ALPHABET.length]).join('')
const expectedFormatted = `${expectedRaw.slice(0, 5)}-${expectedRaw.slice(5)}`
const expectedHash = sha256(expectedRaw)

const DELETE_SQL = `delete from "tenant"."person_backup_code" where "person_id" = ?`
const INSERT_SQL = `insert into "tenant"."person_backup_code" ("id", "person_id", "code_hash", "created_at") values (?, ?, ?, ?)`

describe('BackupCodeManager', () => {
	test('generate replaces the whole set atomically (delete + 10 inserts in one transaction)', async () => {
		const providers = baseProviders()
		// The DELETE + inserts run inside a single REPEATABLE READ transaction so a
		// mid-flow failure can't leave a partial set mismatched with the returned codes.
		const queries: ExpectedQuery[] = [
			{ sql: `BEGIN;`, response: { rowCount: 1 } },
			{ sql: `SET TRANSACTION ISOLATION LEVEL REPEATABLE READ`, response: { rowCount: 1 } },
			{ sql: DELETE_SQL, parameters: [PERSON_ID], response: { rowCount: 3 } },
		]
		for (let i = 0; i < 10; i++) {
			queries.push({
				sql: INSERT_SQL,
				parameters: [`uuid-${i}`, PERSON_ID, expectedHash, NOW],
				response: { rowCount: 1 },
			})
		}
		queries.push({ sql: `COMMIT;`, response: { rowCount: 1 } })
		const db = makeDb(queries, providers)
		const codes = await new BackupCodeManager(makeMailer().mailer, providers).generate(db, PERSON_ID)

		expect(codes).toHaveLength(10)
		expect(codes.every(c => c === expectedFormatted)).toBe(true)
		// Display formatting: single hyphen splitting two 5-char halves.
		expect(codes[0]).toMatch(/^[a-z2-9]{5}-[a-z2-9]{5}$/)
		expect(queries).toHaveLength(0)
	})

	test('verifyAndConsume returns true when an unused code is consumed (codes remain → no email)', async () => {
		const providers = baseProviders()
		const queries: ExpectedQuery[] = [
			{
				sql: `update "tenant"."person_backup_code" set "used_at" = ? where "person_id" = ? and "code_hash" = ? and "used_at" is null`,
				parameters: [NOW, PERSON_ID, expectedHash],
				response: { rowCount: 1 },
			},
			countUnusedSql(3),
		]
		const db = makeDb(queries, providers)
		const { mailer, sendBackupCodesExhaustedEmail } = makeMailer()
		const ok = await new BackupCodeManager(mailer, providers).verifyAndConsume(db, person(), expectedFormatted)
		expect(ok).toBe(true)
		expect(queries).toHaveLength(0)
		expect(sendBackupCodesExhaustedEmail).toHaveBeenCalledTimes(0)
	})

	test('verifyAndConsume sends the exhausted email exactly once when the last code is used', async () => {
		const providers = baseProviders()
		const queries: ExpectedQuery[] = [
			{
				sql: `update "tenant"."person_backup_code" set "used_at" = ? where "person_id" = ? and "code_hash" = ? and "used_at" is null`,
				parameters: [NOW, PERSON_ID, expectedHash],
				response: { rowCount: 1 },
			},
			countUnusedSql(0),
		]
		const db = makeDb(queries, providers)
		const { mailer, sendBackupCodesExhaustedEmail } = makeMailer()
		const ok = await new BackupCodeManager(mailer, providers).verifyAndConsume(db, person(), expectedFormatted)
		expect(ok).toBe(true)
		expect(queries).toHaveLength(0)
		expect(sendBackupCodesExhaustedEmail).toHaveBeenCalledTimes(1)
		expect(sendBackupCodesExhaustedEmail.mock.calls[0][1]).toEqual({ email: PERSON_EMAIL })
		expect(sendBackupCodesExhaustedEmail.mock.calls[0][2]).toEqual({ projectId: null, variant: '' })
	})

	test('verifyAndConsume still returns true if sending the exhausted email throws (best-effort)', async () => {
		const providers = baseProviders()
		const queries: ExpectedQuery[] = [
			{
				sql: `update "tenant"."person_backup_code" set "used_at" = ? where "person_id" = ? and "code_hash" = ? and "used_at" is null`,
				parameters: [NOW, PERSON_ID, expectedHash],
				response: { rowCount: 1 },
			},
			countUnusedSql(0),
		]
		const db = makeDb(queries, providers)
		const { mailer, sendBackupCodesExhaustedEmail } = makeMailer(() => Promise.reject(new Error('smtp down')))
		const ok = await new BackupCodeManager(mailer, providers).verifyAndConsume(db, person(), expectedFormatted)
		expect(ok).toBe(true)
		expect(sendBackupCodesExhaustedEmail).toHaveBeenCalledTimes(1)
	})

	test('verifyAndConsume returns false on a second use of the same code (no row updated, no email)', async () => {
		const providers = baseProviders()
		const queries: ExpectedQuery[] = [
			{
				sql: `update "tenant"."person_backup_code" set "used_at" = ? where "person_id" = ? and "code_hash" = ? and "used_at" is null`,
				parameters: [NOW, PERSON_ID, expectedHash],
				response: { rowCount: 0 },
			},
		]
		const db = makeDb(queries, providers)
		const { mailer, sendBackupCodesExhaustedEmail } = makeMailer()
		const ok = await new BackupCodeManager(mailer, providers).verifyAndConsume(db, person(), expectedFormatted)
		expect(ok).toBe(false)
		expect(queries).toHaveLength(0)
		expect(sendBackupCodesExhaustedEmail).toHaveBeenCalledTimes(0)
	})

	test('verifyAndConsume normalizes formatting and case before hashing', async () => {
		const providers = baseProviders()
		// Same logical code, supplied uppercased and with extra hyphens/spaces.
		const messyInput = ` ${expectedFormatted.toUpperCase().replace('-', '--')} `
		const queries: ExpectedQuery[] = [
			{
				sql: `update "tenant"."person_backup_code" set "used_at" = ? where "person_id" = ? and "code_hash" = ? and "used_at" is null`,
				// Must hash to the SAME value as the canonical formatted code.
				parameters: [NOW, PERSON_ID, expectedHash],
				response: { rowCount: 1 },
			},
			countUnusedSql(2),
		]
		const db = makeDb(queries, providers)
		const ok = await new BackupCodeManager(makeMailer().mailer, providers).verifyAndConsume(db, person(), messyInput)
		expect(ok).toBe(true)
		expect(queries).toHaveLength(0)
	})

	test('verifyAndConsume returns false for empty input without hitting the DB (no email)', async () => {
		const providers = baseProviders()
		const db = makeDb([], providers)
		const { mailer, sendBackupCodesExhaustedEmail } = makeMailer()
		const ok = await new BackupCodeManager(mailer, providers).verifyAndConsume(db, person(), '   ')
		expect(ok).toBe(false)
		expect(sendBackupCodesExhaustedEmail).toHaveBeenCalledTimes(0)
	})
})
