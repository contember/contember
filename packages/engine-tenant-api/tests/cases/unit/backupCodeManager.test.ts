import { describe, expect, test } from 'bun:test'
import crypto from 'node:crypto'
import { createConnectionMock, ExpectedQuery } from '@contember/database-tester'
import { BackupCodeManager, DatabaseContext, Providers } from '../../../src'

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
	hash: value => Buffer.from(value.toString()),
	...overrides,
})

const makeDb = (queries: ExpectedQuery[], providers: Providers) => {
	const connection = createConnectionMock(queries)
	const client = connection.createClient('tenant', { module: 'tenant' })
	return new DatabaseContext(client, providers)
}

const ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789'
// With sequentialBytes, byte i = i, so char i = ALPHABET[i % 32].
const expectedRaw = Array.from({ length: 10 }, (_, i) => ALPHABET[i % ALPHABET.length]).join('')
const expectedFormatted = `${expectedRaw.slice(0, 5)}-${expectedRaw.slice(5)}`
const expectedHash = sha256(expectedRaw)

const DELETE_SQL = `delete from "tenant"."person_backup_code" where "person_id" = ?`
const INSERT_SQL = `insert into "tenant"."person_backup_code" ("id", "person_id", "code_hash", "created_at") values (?, ?, ?, ?)`

describe('BackupCodeManager', () => {
	test('generate deletes the old set and produces 10 codes (stored as normalized hashes)', async () => {
		const providers = baseProviders()
		const queries: ExpectedQuery[] = [
			{ sql: DELETE_SQL, parameters: [PERSON_ID], response: { rowCount: 3 } },
		]
		for (let i = 0; i < 10; i++) {
			queries.push({
				sql: INSERT_SQL,
				parameters: [`uuid-${i}`, PERSON_ID, expectedHash, NOW],
				response: { rowCount: 1 },
			})
		}
		const db = makeDb(queries, providers)
		const codes = await new BackupCodeManager(providers).generate(db, PERSON_ID)

		expect(codes).toHaveLength(10)
		expect(codes.every(c => c === expectedFormatted)).toBe(true)
		// Display formatting: single hyphen splitting two 5-char halves.
		expect(codes[0]).toMatch(/^[a-z2-9]{5}-[a-z2-9]{5}$/)
		expect(queries).toHaveLength(0)
	})

	test('verifyAndConsume returns true when an unused code is consumed', async () => {
		const providers = baseProviders()
		const queries: ExpectedQuery[] = [
			{
				sql: `update "tenant"."person_backup_code" set "used_at" = ? where "person_id" = ? and "code_hash" = ? and "used_at" is null`,
				parameters: [NOW, PERSON_ID, expectedHash],
				response: { rowCount: 1 },
			},
		]
		const db = makeDb(queries, providers)
		const ok = await new BackupCodeManager(providers).verifyAndConsume(db, PERSON_ID, expectedFormatted)
		expect(ok).toBe(true)
		expect(queries).toHaveLength(0)
	})

	test('verifyAndConsume returns false on a second use of the same code (no row updated)', async () => {
		const providers = baseProviders()
		const queries: ExpectedQuery[] = [
			{
				sql: `update "tenant"."person_backup_code" set "used_at" = ? where "person_id" = ? and "code_hash" = ? and "used_at" is null`,
				parameters: [NOW, PERSON_ID, expectedHash],
				response: { rowCount: 0 },
			},
		]
		const db = makeDb(queries, providers)
		const ok = await new BackupCodeManager(providers).verifyAndConsume(db, PERSON_ID, expectedFormatted)
		expect(ok).toBe(false)
		expect(queries).toHaveLength(0)
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
		]
		const db = makeDb(queries, providers)
		const ok = await new BackupCodeManager(providers).verifyAndConsume(db, PERSON_ID, messyInput)
		expect(ok).toBe(true)
		expect(queries).toHaveLength(0)
	})

	test('verifyAndConsume returns false for empty input without hitting the DB', async () => {
		const providers = baseProviders()
		const db = makeDb([], providers)
		const ok = await new BackupCodeManager(providers).verifyAndConsume(db, PERSON_ID, '   ')
		expect(ok).toBe(false)
	})
})
