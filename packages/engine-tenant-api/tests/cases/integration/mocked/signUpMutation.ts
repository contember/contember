import 'jasmine'
import { executeTenantTest } from '../../../src/testTenant'
import { signUpMutation } from './gql/signUp'
import { SQL } from '../../../src/tags'
import { testUuid } from '../../../src/testUuid'
import { createPersonSql } from './sql/createPersonSql'
import { createIdentitySql } from './sql/createIdentitySql'
import { getPersonByEmailSql } from './sql/getPersonByEmailSql'
import { sqlTransaction } from './sql/sqlTransaction'
import { disableOneOffKeySql } from './sql/disableOneOffKeySql'

describe('sign up mutation', () => {
	it('signs up a new user', async () => {
		const email = 'john@doe.com'
		const password = '123456'
		const identityId = testUuid(1)
		const personId = testUuid(2)
		const projectId = testUuid(3)
		await executeTenantTest({
			query: signUpMutation({ email, password }),
			executes: [
				getPersonByEmailSql({ email, response: null }),
				...sqlTransaction(
					createIdentitySql({ identityId, roles: ['person'] }),
					createPersonSql({ personId, email, password, identityId }),
				),
				disableOneOffKeySql({ id: testUuid(998) }),
				{
					sql: SQL`select
                       "project"."id",
                       "project"."name",
                       "project"."slug"
                     from "tenant"."project"
                       inner join "tenant"."project_member" as "project_member" on "project_member"."project_id" = "project"."id"
                     where "project_member"."identity_id" = ?`,
					parameters: [identityId],
					response: { rows: [{ id: projectId, name: 'foo', slug: 'foo' }] },
				},
			],
			return: {
				data: {
					signUp: {
						ok: true,
						errors: [],
						result: {
							person: {
								id: personId,
							},
						},
					},
				},
			},
		})
	})

	it('does not sign up user with existing email', async () => {
		const personId = testUuid(1)
		const email = 'john@doe.com'
		const password = '123456'
		await executeTenantTest({
			query: signUpMutation({ email, password }),
			executes: [
				getPersonByEmailSql({ email, response: { personId, password: '', roles: [], identityId: testUuid(1) } }),
			],
			return: {
				data: {
					signUp: {
						ok: false,
						errors: [
							{
								code: 'EMAIL_ALREADY_EXISTS',
							},
						],
						result: null,
					},
				},
			},
		})
	})
})
