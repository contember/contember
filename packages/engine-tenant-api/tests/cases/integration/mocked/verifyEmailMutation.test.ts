import { executeTenantTest, now } from '../../../src/testTenant.js'
import { SQL } from '../../../src/tags.js'
import { testUuid } from '../../../src/testUuid.js'
import { expect, test } from 'bun:test'
import { verifyEmailMutation } from './gql/emailVerification.js'
import { computeTokenHash } from '../../../../src/index.js'
import { sqlTransaction } from './sql/sqlTransaction.js'

const anyString = (val: unknown) => typeof val === 'string'
const isDate = (val: unknown) => val instanceof Date

test('verifyEmail - marks the email verified and consumes the token', async () => {
	const token = 'verification-token'
	const tokenId = testUuid(1)
	const personId = testUuid(2)
	await executeTenantTest({
		query: verifyEmailMutation({ token }),
		executes: [
			{
				sql: SQL`SELECT * FROM "tenant"."person_token" WHERE "token_hash" = ? AND "type" = ?`,
				parameters: [anyString, 'email_verification'],
				response: {
					rows: [
						{
							id: tokenId,
							token_hash: computeTokenHash(token),
							person_id: personId,
							created_at: now,
							expires_at: new Date(now.getTime() + 60 * 60 * 1000),
							used_at: null,
							otp_hash: null,
							otp_attempts: 0,
							meta: null,
						},
					],
				},
			},
			...sqlTransaction(
				{
					sql: SQL`UPDATE "tenant"."person_token" SET "used_at" = ? WHERE "id" = ? AND "used_at" IS NULL`,
					parameters: [isDate, tokenId],
					response: { rowCount: 1 },
				},
				{
					sql: SQL`UPDATE "tenant"."person" SET "email_verified_at" = ? WHERE "id" = ?`,
					parameters: [isDate, personId],
					response: { rowCount: 1 },
				},
			),
		],
		return: {
			data: {
				verifyEmail: {
					ok: true,
					error: null,
				},
			},
		},
		expectedAuthLog: expect.objectContaining({
			type: 'email_verify_complete',
			response: expect.objectContaining({ ok: true }),
		}),
	})
})

test('verifyEmail - token not found', async () => {
	const token = 'missing-token'
	await executeTenantTest({
		query: verifyEmailMutation({ token }),
		executes: [
			{
				sql: SQL`SELECT * FROM "tenant"."person_token" WHERE "token_hash" = ? AND "type" = ?`,
				parameters: [anyString, 'email_verification'],
				response: { rows: [] },
			},
		],
		return: {
			data: {
				verifyEmail: {
					ok: false,
					error: { code: 'TOKEN_NOT_FOUND' },
				},
			},
		},
		expectedAuthLog: expect.objectContaining({
			type: 'email_verify_complete',
			response: expect.objectContaining({ ok: false }),
		}),
	})
})
