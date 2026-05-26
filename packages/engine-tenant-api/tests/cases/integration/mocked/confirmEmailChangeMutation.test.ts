import { executeTenantTest, now } from '../../../src/testTenant.js'
import { SQL } from '../../../src/tags.js'
import { testUuid } from '../../../src/testUuid.js'
import { expect, test } from 'bun:test'
import { confirmEmailChangeMutation } from './gql/emailVerification.js'
import { computeTokenHash } from '../../../../src/index.js'
import { sqlTransaction } from './sql/sqlTransaction.js'
import { getPersonByIdSql } from './sql/getPersonByIdSql.js'
import { getPersonByEmailSql } from './sql/getPersonByEmailSql.js'
import { getMailTemplateSql } from './sql/getMailTemplateSql.js'

const anyString = (val: unknown) => typeof val === 'string'
const isDate = (val: unknown) => val instanceof Date

test('confirmEmailChange - swaps the email, verifies it and signs out sessions', async () => {
	const token = 'email-change-token'
	const tokenId = testUuid(1)
	const personId = testUuid(2)
	const identityId = testUuid(3)
	const oldEmail = 'john.doe@example.com'
	const newEmail = 'jane@doe.com'
	await executeTenantTest({
		query: confirmEmailChangeMutation({ token }),
		executes: [
			{
				sql: SQL`SELECT * FROM "tenant"."person_token" WHERE "token_hash" = ? AND "type" = ?`,
				parameters: [anyString, 'email_change'],
				response: {
					rows: [
						{
							id: tokenId,
							token_hash: computeTokenHash(token),
							person_id: personId,
							created_at: now,
							expires_at: new Date(now.getTime() + 24 * 60 * 60 * 1000),
							used_at: null,
							otp_hash: null,
							otp_attempts: 0,
							meta: { email: newEmail },
						},
					],
				},
			},
			getPersonByIdSql({ personId, response: { personId, identityId, password: '123', roles: [], email: oldEmail } }),
			getPersonByEmailSql({ email: newEmail, response: null }),
			...sqlTransaction(
				{
					sql: SQL`UPDATE "tenant"."person_token" SET "used_at" = ? WHERE "id" = ? AND "used_at" IS NULL`,
					parameters: [isDate, tokenId],
					response: { rowCount: 1 },
				},
				{
					sql: SQL`UPDATE "tenant"."person" SET "email_verified_at" = ?, "email" = ? WHERE "id" = ?`,
					parameters: [isDate, newEmail, personId],
					response: { rowCount: 1 },
				},
				{
					sql: SQL`UPDATE "tenant"."api_key" SET "disabled_at" = ? WHERE "identity_id" = ?`,
					parameters: [isDate, identityId],
					response: { rowCount: 1 },
				},
			),
			getMailTemplateSql({ type: 'emailChangeNotify', projectId: null }),
			getMailTemplateSql({ type: 'emailChangeNotify', projectId: null }),
		],
		return: {
			data: {
				confirmEmailChange: {
					ok: true,
					error: null,
				},
			},
		},
		expectedAuthLog: expect.objectContaining({
			type: 'email_change_complete',
			personId,
			response: expect.objectContaining({ ok: true }),
		}),
		sentMails: [
			{
				subject: 'Your e-mail address was changed',
			},
		],
	})
})

test('confirmEmailChange - new email taken in the meantime', async () => {
	const token = 'email-change-token'
	const tokenId = testUuid(1)
	const personId = testUuid(2)
	const identityId = testUuid(3)
	const newEmail = 'jane@doe.com'
	await executeTenantTest({
		query: confirmEmailChangeMutation({ token }),
		executes: [
			{
				sql: SQL`SELECT * FROM "tenant"."person_token" WHERE "token_hash" = ? AND "type" = ?`,
				parameters: [anyString, 'email_change'],
				response: {
					rows: [
						{
							id: tokenId,
							token_hash: computeTokenHash(token),
							person_id: personId,
							created_at: now,
							expires_at: new Date(now.getTime() + 24 * 60 * 60 * 1000),
							used_at: null,
							otp_hash: null,
							otp_attempts: 0,
							meta: { email: newEmail },
						},
					],
				},
			},
			getPersonByIdSql({ personId, response: { personId, identityId, password: '123', roles: [], email: 'john.doe@example.com' } }),
			getPersonByEmailSql({ email: newEmail, response: { personId: testUuid(9), identityId: testUuid(10), roles: [], password: '' } }),
		],
		return: {
			data: {
				confirmEmailChange: {
					ok: false,
					error: { code: 'EMAIL_ALREADY_EXISTS' },
				},
			},
		},
		expectedAuthLog: expect.objectContaining({
			type: 'email_change_complete',
			response: expect.objectContaining({ ok: false }),
		}),
	})
})
