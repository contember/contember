import { testTenantDb } from '../../../src/testTenantDb'
import { GQL } from '../../../src/tags'
import { assert, test } from 'vitest'
import { signUpMutation } from '../mocked/gql/signUp'
import { TenantRole } from '../../../../src'


test('manage global roles', testTenantDb(async ({ tester }) => {
	const result = await tester.execute(
		signUpMutation({
			email: 'john@doe.com',
			password: 'abcdxy',
		}),
		{
			roles: [TenantRole.SUPER_ADMIN],
		},
	)
	assert.isOk(result.data.signUp.ok)
	const identity = result.data.signUp.result.person.identity.id
	assert.deepStrictEqual(result.data.signUp.result.person.identity.roles, [TenantRole.PERSON])

	const resultAddRole = await tester.execute(GQL`
			mutation {
				addGlobalIdentityRoles(identityId: "${identity}", roles: ["project_admin", "super_admin"]) {
					ok
					result {
						identity {
							roles
						}
					}
				}
			}
		`, {
		roles: [TenantRole.SUPER_ADMIN],
	})

	assert.deepStrictEqual(resultAddRole.data, {
		addGlobalIdentityRoles: {
			ok: true,
			result: {
				identity: {
					roles: [TenantRole.PERSON, TenantRole.PROJECT_ADMIN, TenantRole.SUPER_ADMIN],
				},
			},
		},
	})


	const resultRemoveRole = await tester.execute(GQL`
			mutation {
				removeGlobalIdentityRoles(identityId: "${identity}", roles: ["project_admin", "super_admin"]) {
					ok
					result {
						identity {
							roles
						}
					}
				}
			}
		`, {
		roles: [TenantRole.SUPER_ADMIN],
	})

	assert.deepStrictEqual(resultRemoveRole.data, {
		removeGlobalIdentityRoles: {
			ok: true,
			result: {
				identity: {
					roles: [TenantRole.PERSON],
				},
			},
		},
	})
}))
