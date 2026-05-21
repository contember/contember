import { describe, expect, test } from 'bun:test'
import crypto from 'node:crypto'
import { createConnectionMock, ExpectedQuery } from '@contember/database-tester'
import { DatabaseContext, EmailOtpManager, PersonRow, Providers, TemplateRenderer, UserMailer } from '../../../src'
import { createMockedMailer } from '../../src/mailer'

const NOW = new Date('2026-05-20T12:00:00.000Z')
const PERSON_ID = '123e4567-e89b-12d3-a456-000000000001'

const sha256 = (value: string) => crypto.createHash('sha256').update(value, 'ascii').digest('hex')

/** byte i = i, so the 6-digit code is deterministic: (i % 10) => "012345". */
const sequentialBytes = (length: number): Promise<Buffer> => {
	const buf = Buffer.alloc(length)
	for (let i = 0; i < length; i++) {
		buf[i] = i
	}
	return Promise.resolve(buf)
}

const EXPECTED_CODE = '012345'
const EXPECTED_OTP_HASH = sha256(EXPECTED_CODE)
// generateToken reads 20 random bytes; with sequentialBytes that's 00..13 hex.
const RANDOM_TOKEN_HEX = Buffer.from(Array.from({ length: 20 }, (_, i) => i)).toString('hex')
const RANDOM_TOKEN_HASH = sha256(RANDOM_TOKEN_HEX)

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

const makeMailer = () => new UserMailer(createMockedMailer(), new TemplateRenderer())

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
	email_otp_enabled: true,
	email: 'john@doe.com',
	name: null,
	roles: [],
	disabled_at: null,
	passwordless_enabled: null,
	...overrides,
})

const tokenRow = (overrides: Record<string, any> = {}) => ({
	id: 'token-1',
	created_at: NOW,
	token_hash: RANDOM_TOKEN_HASH,
	used_at: null,
	expires_at: new Date(NOW.getTime() + 10 * 60 * 1000),
	person_id: PERSON_ID,
	otp_hash: EXPECTED_OTP_HASH,
	otp_attempts: 0,
	...overrides,
})

const INVALIDATE_PRIOR_SQL = `update "tenant"."person_token" set "used_at" = ? where "person_id" = ? and "type" = ? and "used_at" is null`
const INSERT_TOKEN_SQL =
	`insert into "tenant"."person_token" ("id", "token_hash", "person_id", "expires_at", "created_at", "used_at", "type", "otp_hash") values (?, ?, ?, ?, ?, ?, ?, ?)`
const SELECT_LATEST_SQL =
	`select * from "tenant"."person_token" where "person_id" = ? and "type" = ? and "used_at" is null order by "created_at" desc limit 1`

describe('EmailOtpManager', () => {
	test('sendCode generates a 6-digit code, invalidates prior tokens, stores the hashed code and emails it', async () => {
		const providers = baseProviders()
		const queries: ExpectedQuery[] = [
			{
				sql: INVALIDATE_PRIOR_SQL,
				parameters: [NOW, PERSON_ID, 'mfa_email_otp'],
				response: { rowCount: 0 },
			},
			{
				sql: INSERT_TOKEN_SQL,
				parameters: [
					'uuid-0',
					RANDOM_TOKEN_HASH,
					PERSON_ID,
					(v: any) => v instanceof Date,
					NOW,
					null,
					'mfa_email_otp',
					EXPECTED_OTP_HASH,
				],
				response: { rowCount: 1 },
			},
			// custom-template lookup — getCustomTemplate queries twice (identifier, then projectId:null
			// fallback); both collapse to the same IS NULL query since email OTP is account-level.
			{
				sql:
					`select "mail_template"."id", "subject", "content", "use_layout" as "useLayout", "reply_to" as "replyTo", "project_id" as "projectId", "mail_type" as "type", "variant" FROM "tenant"."mail_template" WHERE "project_id" IS NULL AND "mail_type" = ? AND "variant" = ?`,
				parameters: ['emailOtp', ''],
				response: { rows: [] },
			},
			{
				sql:
					`select "mail_template"."id", "subject", "content", "use_layout" as "useLayout", "reply_to" as "replyTo", "project_id" as "projectId", "mail_type" as "type", "variant" FROM "tenant"."mail_template" WHERE "project_id" IS NULL AND "mail_type" = ? AND "variant" = ?`,
				parameters: ['emailOtp', ''],
				response: { rows: [] },
			},
		]
		const db = makeDb(queries, providers)
		const mailer = createMockedMailer()
		await new EmailOtpManager(new UserMailer(mailer, new TemplateRenderer()), providers).sendCode(db, person())
		const sent = mailer.expectMessage({ subject: 'Your verification code' })
		expect(sent.html).toContain(EXPECTED_CODE)
		mailer.expectEmpty()
		expect(queries).toHaveLength(0)
	})

	test('verifyAndConsume accepts the correct code and consumes the token', async () => {
		const providers = baseProviders()
		const queries: ExpectedQuery[] = [
			{
				sql: SELECT_LATEST_SQL,
				parameters: [PERSON_ID, 'mfa_email_otp'],
				response: { rows: [tokenRow()] },
			},
			{
				sql: `update "tenant"."person_token" set "used_at" = ? where "id" = ? and "used_at" is null`,
				parameters: [NOW, 'token-1'],
				response: { rowCount: 1 },
			},
		]
		const db = makeDb(queries, providers)
		const ok = await new EmailOtpManager(makeMailer(), providers).verifyAndConsume(db, person(), EXPECTED_CODE)
		expect(ok).toBe(true)
		expect(queries).toHaveLength(0)
	})

	test('verifyAndConsume rejects a wrong code and bumps the attempt counter', async () => {
		const providers = baseProviders()
		const queries: ExpectedQuery[] = [
			{
				sql: SELECT_LATEST_SQL,
				parameters: [PERSON_ID, 'mfa_email_otp'],
				response: { rows: [tokenRow()] },
			},
			{
				sql: `update "tenant"."person_token" set "otp_attempts" = otp_attempts + 1 where "id" = ?`,
				parameters: ['token-1'],
				response: { rowCount: 1 },
			},
		]
		const db = makeDb(queries, providers)
		const ok = await new EmailOtpManager(makeMailer(), providers).verifyAndConsume(db, person(), '999999')
		expect(ok).toBe(false)
		expect(queries).toHaveLength(0)
	})

	test('verifyAndConsume rejects once the attempt cap is exceeded (no counter bump)', async () => {
		const providers = baseProviders()
		const queries: ExpectedQuery[] = [
			{
				sql: SELECT_LATEST_SQL,
				parameters: [PERSON_ID, 'mfa_email_otp'],
				// 3 attempts already used => validateToken returns TOKEN_EXPIRED before checking the code.
				response: { rows: [tokenRow({ otp_attempts: 3 })] },
			},
		]
		const db = makeDb(queries, providers)
		const ok = await new EmailOtpManager(makeMailer(), providers).verifyAndConsume(db, person(), EXPECTED_CODE)
		expect(ok).toBe(false)
		expect(queries).toHaveLength(0)
	})

	test('verifyAndConsume returns false when there is no token', async () => {
		const providers = baseProviders()
		const queries: ExpectedQuery[] = [
			{
				sql: SELECT_LATEST_SQL,
				parameters: [PERSON_ID, 'mfa_email_otp'],
				response: { rows: [] },
			},
		]
		const db = makeDb(queries, providers)
		const ok = await new EmailOtpManager(makeMailer(), providers).verifyAndConsume(db, person(), EXPECTED_CODE)
		expect(ok).toBe(false)
		expect(queries).toHaveLength(0)
	})
})
