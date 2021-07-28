import { executeTenantTest } from '../../../src/testTenant'
import { SQL } from '../../../src/tags'
import { testUuid } from '../../../src/testUuid'
import { selectMembershipsSql } from './sql/selectMembershipsSql'
import { signInMutation } from './gql/signIn'
import { getPersonByEmailSql } from './sql/getPersonByEmailSql'
import { SignInErrorCode } from '../../../../src/schema'
import { createOtp, generateOtp } from '../../../../src/model/utils/otp'
import { test } from 'uvu'

const createApiKeySql = function ({ apiKeyId, identityId }: { apiKeyId: string; identityId: string }) {
	return {
		sql: SQL`INSERT INTO "tenant"."api_key" ("id", "token_hash", "type", "identity_id", "disabled_at", "expires_at", "expiration", "created_at")
			         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		parameters: [
			apiKeyId,
			'9692e67b8378a6f6753f97782d458aa757e947eab2fbdf6b5c187b74561eb78f',
			'session',
			identityId,
			null,
			new Date('2019-09-04 12:30'),
			null,
			new Date('2019-09-04 12:00'),
		],
		response: { rowCount: 1 },
	}
}
const getIdentityProjectsSql = function ({ identityId, projectId }: { identityId: string; projectId: string }) {
	return {
		sql: SQL`SELECT "project"."id", "project"."name", "project"."slug", "project"."config"
			         FROM "tenant"."project"
			         WHERE "project"."id" IN (SELECT "project_id" FROM "tenant"."project_membership" WHERE "identity_id" = ?) AND
					         "project"."id" IN (SELECT "project_id" FROM "tenant"."project_membership" WHERE "identity_id" = ?)`,
		parameters: [identityId, identityId],
		response: { rows: [{ id: projectId, name: 'Foo', slug: 'foo' }] },
	}
}
test('signs in', async () => {
	const email = 'john@doe.com'
	const password = '123'
	const identityId = testUuid(2)
	const personId = testUuid(7)
	const projectId = testUuid(10)
	const apiKeyId = testUuid(1)
	await executeTenantTest({
		query: signInMutation({ email, password }, { withData: true }),
		executes: [
			getPersonByEmailSql({ email, response: { personId, identityId, password, roles: [] } }),
			createApiKeySql({ apiKeyId: apiKeyId, identityId: identityId }),
			getIdentityProjectsSql({ identityId: identityId, projectId: projectId }),
			selectMembershipsSql({
				identityId: identityId,
				projectId,
				membershipsResponse: [{ role: 'editor', variables: [{ name: 'locale', values: ['cs'] }] }],
			}),
			{
				sql: SQL`SELECT "id",
						         "email",
						         "identity_id"
					         FROM "tenant"."person"
					         WHERE "id" = ?`,
				parameters: [personId],
				response: { rows: [{ id: personId, email: email }] },
			},
			{
				sql: SQL`SELECT "project"."id",
						         "project"."name",
						         "project"."slug",
						         "project"."config"
					         FROM "tenant"."project"
						              INNER JOIN "tenant"."project_member" AS "project_member" ON "project_member"."project_id" = "project"."id"
					         WHERE "project_member"."identity_id" = ?`,
				parameters: [identityId],
				response: { rows: [{ id: projectId, name: 'foo' }] },
			},
		],
		return: {
			data: {
				signIn: {
					ok: true,
					errors: [],
					result: {
						person: {
							id: personId,
							identity: {
								projects: [
									{
										project: {
											slug: 'foo',
										},
										memberships: [
											{
												role: 'editor',
											},
										],
									},
								],
							},
						},
						token: '0000000000000000000000000000000000000000',
					},
				},
			},
		},
	})
})

test('sign in - invalid password', async () => {
	const email = 'john@doe.com'
	const password = '123'
	const identityId = testUuid(2)
	const personId = testUuid(7)
	await executeTenantTest({
		query: signInMutation({ email, password: 'abcd' }),
		executes: [getPersonByEmailSql({ email, response: { personId, identityId, password, roles: [] } })],
		return: {
			data: {
				signIn: {
					ok: false,
					errors: [{ code: SignInErrorCode.InvalidPassword }],
					result: null,
				},
			},
		},
	})
})

test('otp token not provided', async () => {
	const email = 'john@doe.com'
	const password = '123'
	const identityId = testUuid(2)
	const personId = testUuid(7)
	const otp = createOtp('a', 'b')
	await executeTenantTest({
		query: signInMutation({ email, password }),
		executes: [
			getPersonByEmailSql({ email, response: { personId, identityId, password, roles: [], otpUri: otp.uri } }),
		],
		return: {
			data: {
				signIn: {
					ok: false,
					errors: [{ code: SignInErrorCode.OtpRequired }],
					result: null,
				},
			},
		},
	})
})

test('sign in - invalid otp token', async () => {
	const email = 'john@doe.com'
	const password = '123'
	const identityId = testUuid(2)
	const personId = testUuid(7)
	const otp = createOtp('a', 'b')
	await executeTenantTest({
		query: signInMutation({ email, password, otpToken: '123' }),
		executes: [
			getPersonByEmailSql({ email, response: { personId, identityId, password, roles: [], otpUri: otp.uri } }),
		],
		return: {
			data: {
				signIn: {
					ok: false,
					errors: [{ code: SignInErrorCode.InvalidOtpToken }],
					result: null,
				},
			},
		},
	})
})

test('sign in - valid otp token', async () => {
	const email = 'john@doe.com'
	const password = '123'
	const identityId = testUuid(2)
	const personId = testUuid(7)
	const otp = createOtp('a', 'b')
	const apiKeyId = testUuid(1)
	const projectId = testUuid(10)
	await executeTenantTest({
		query: signInMutation({ email, password, otpToken: generateOtp(otp) }),
		executes: [
			getPersonByEmailSql({ email, response: { personId, identityId, password, roles: [], otpUri: otp.uri } }),
			createApiKeySql({ apiKeyId, identityId }),
			getIdentityProjectsSql({ identityId, projectId }),
			selectMembershipsSql({
				identityId,
				projectId,
				membershipsResponse: [],
			}),
		],
		return: {
			data: {
				signIn: {
					ok: true,
					errors: [],
					result: {
						token: '0000000000000000000000000000000000000000',
					},
				},
			},
		},
	})
})

test.run()
