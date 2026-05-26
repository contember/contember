import { executeTenantTest, now } from '../../../src/testTenant'
import { SQL } from '../../../src/tags'
import { testUuid } from '../../../src/testUuid'
import { expect, test } from 'bun:test'
import { signInPasswordlessMutation } from './gql/passwordless'
import { computeTokenHash } from '../../../../src'
import { sqlTransaction } from './sql/sqlTransaction'
import { getPersonByIdSql } from './sql/getPersonByIdSql'
import { getConfigSql } from './sql/getConfigSql'
import { createSessionKeySql } from './sql/createSessionKeySql'
import { getIdentityProjectsSql } from './sql/getIdentityProjectsSql'

const isDate = (val: unknown) => val instanceof Date

const personTokenByIdSql = (args: {
	requestId: string
	personId: string
	token: string
}) => ({
	sql: SQL`SELECT * FROM "tenant"."person_token" WHERE "id" = ? AND "type" = ?`,
	parameters: [args.requestId, 'passwordless'],
	response: {
		rows: [
			{
				id: args.requestId,
				token_hash: computeTokenHash(args.token),
				person_id: args.personId,
				created_at: now,
				expires_at: new Date(now.getTime() + 60 * 60 * 1000),
				used_at: null,
				otp_hash: null,
				otp_attempts: 0,
				meta: null,
			},
		],
	},
})

test('signInPasswordless - marks an unverified email verified before issuing the session', async () => {
	const requestId = testUuid(1)
	const personId = testUuid(2)
	const identityId = testUuid(3)
	const apiKeyId = testUuid(1)
	const projectId = testUuid(10)
	const token = 'passwordless-token'
	await executeTenantTest({
		query: signInPasswordlessMutation({ requestId, token, validationType: 'token' }),
		executes: [
			...sqlTransaction(
				personTokenByIdSql({ requestId, personId, token }),
				getPersonByIdSql({
					personId,
					response: { personId, identityId, password: '123', roles: [], email: 'john@doe.com', emailVerifiedAt: null },
				}),
				{
					sql: SQL`UPDATE "tenant"."person_token" SET "used_at" = ? WHERE "id" = ? AND "used_at" IS NULL`,
					parameters: [isDate, requestId],
					response: { rowCount: 1 },
				},
				{
					sql: SQL`UPDATE "tenant"."person" SET "email_verified_at" = ? WHERE "id" = ?`,
					parameters: [isDate, personId],
					response: { rowCount: 1 },
				},
				getConfigSql(),
				createSessionKeySql({ apiKeyId, identityId }),
			),
			// SignInResponseFactory resolves the signed-in identity's projects when
			// building the response (no memberships follow because none are returned).
			{
				...getIdentityProjectsSql({ identityId, projectId }),
				response: { rows: [] },
			},
		],
		return: {
			data: {
				signInPasswordless: {
					ok: true,
					error: null,
					result: {
						token: expect.stringMatching(/\w+/),
					},
				},
			},
		},
		expectedAuthLog: {
			type: 'passwordless_login',
			response: expect.objectContaining({ ok: true }),
		},
	})
})

test('signInPasswordless - skips the email-verified update when already verified', async () => {
	const requestId = testUuid(1)
	const personId = testUuid(2)
	const identityId = testUuid(3)
	const apiKeyId = testUuid(1)
	const projectId = testUuid(10)
	const token = 'passwordless-token'
	await executeTenantTest({
		query: signInPasswordlessMutation({ requestId, token, validationType: 'token' }),
		executes: [
			...sqlTransaction(
				personTokenByIdSql({ requestId, personId, token }),
				getPersonByIdSql({
					personId,
					response: { personId, identityId, password: '123', roles: [], email: 'john@doe.com', emailVerifiedAt: now },
				}),
				{
					sql: SQL`UPDATE "tenant"."person_token" SET "used_at" = ? WHERE "id" = ? AND "used_at" IS NULL`,
					parameters: [isDate, requestId],
					response: { rowCount: 1 },
				},
				getConfigSql(),
				createSessionKeySql({ apiKeyId, identityId }),
			),
			// SignInResponseFactory resolves the signed-in identity's projects when
			// building the response (no memberships follow because none are returned).
			{
				...getIdentityProjectsSql({ identityId, projectId }),
				response: { rows: [] },
			},
		],
		return: {
			data: {
				signInPasswordless: {
					ok: true,
					error: null,
					result: {
						token: expect.stringMatching(/\w+/),
					},
				},
			},
		},
		expectedAuthLog: {
			type: 'passwordless_login',
			response: expect.objectContaining({ ok: true }),
		},
	})
})
