import { executeTenantTest, now } from '../../../src/testTenant'
import { SQL } from '../../../src/tags'
import { testUuid } from '../../../src/testUuid'
import { expect, test } from 'bun:test'
import { verifyEmailMutation } from './gql/emailVerification'
import { computeTokenHash } from '../../../../src'
import { sqlTransaction } from './sql/sqlTransaction'

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

test('verifyEmail - token expired', async () => {
	const token = 'expired-token'
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
							// Expired an hour before the mocked clock — no consume/verify follows.
							expires_at: new Date(now.getTime() - 60 * 60 * 1000),
							used_at: null,
							otp_hash: null,
							otp_attempts: 0,
							meta: null,
						},
					],
				},
			},
		],
		return: {
			data: {
				verifyEmail: {
					ok: false,
					error: { code: 'TOKEN_EXPIRED' },
				},
			},
		},
		expectedAuthLog: expect.objectContaining({
			type: 'email_verify_complete',
			response: expect.objectContaining({ ok: false }),
		}),
	})
})

test('verifyEmail - token already used', async () => {
	const token = 'used-token'
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
							// Already consumed — a replay must not re-verify or re-consume.
							used_at: new Date(now.getTime() - 60 * 1000),
							otp_hash: null,
							otp_attempts: 0,
							meta: null,
						},
					],
				},
			},
		],
		return: {
			data: {
				verifyEmail: {
					ok: false,
					error: { code: 'TOKEN_USED' },
				},
			},
		},
		expectedAuthLog: expect.objectContaining({
			type: 'email_verify_complete',
			response: expect.objectContaining({ ok: false }),
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
