import { GQL, SQL } from '../../../src/tags.js'
import { testUuid } from '../../../src/testUuid.js'
import { executeTenantTest } from '../../../src/testTenant.js'
import { getPersonsByIdentitySql } from './sql/getPersonsByIdentitySql.js'
import { expect, test } from 'bun:test'
import { getCustomRolesForValidationSql } from './sql/getCustomRolesSql.js'
import { ExpectedQuery } from '@contember/database-tester'
import { sqlReadCommittedTransaction } from './sql/sqlTransaction.js'
import { getIdentityProjectMembershipPresenceSql } from './sql/getIdentityProjectMembershipPresenceSql.js'

const selectIdentitySql = (args: { identityId: string; roles: readonly string[]; lock?: boolean }): ExpectedQuery => ({
	sql: args.lock
		? SQL`SELECT "id", "description", "roles" FROM "tenant"."identity" WHERE "id" IN (?) FOR UPDATE`
		: SQL`SELECT "id", "description", "roles" FROM "tenant"."identity" WHERE "id" IN (?)`,
	parameters: [args.identityId],
	response: {
		rows: [{ id: args.identityId, description: null, roles: args.roles }],
	},
})

const patchIdentityRolesSql = (args: {
	identityId: string
	add: readonly string[]
	remove: readonly string[]
}): ExpectedQuery => ({
	sql: SQL`UPDATE "tenant"."identity" SET "roles" = (
				SELECT COALESCE(JSONB_AGG(DISTINCT out_role), '[]'::jsonb)
				FROM JSONB_ARRAY_ELEMENTS_TEXT(roles || ?::jsonb) t(out_role)
				WHERE NOT(out_role = ANY (?::text[]))
			) WHERE "id" = ?`,
	parameters: [JSON.stringify(args.add), args.remove, args.identityId],
	response: { rowCount: 1 },
})

test('adds a global identity role', async () => {
	const identityId = testUuid(6)
	const personId = testUuid(7)
	const role = 'super_admin'
	await executeTenantTest({
		query: GQL`mutation {
			addGlobalIdentityRoles(identityId: "${identityId}", roles: ["${role}"]) {
				ok
				error { code }
			}
		}`,
		executes: [
			...sqlReadCommittedTransaction(
				selectIdentitySql({ identityId, roles: [], lock: true }),
				getIdentityProjectMembershipPresenceSql(identityId),
				patchIdentityRolesSql({ identityId, add: [role], remove: [] }),
				selectIdentitySql({ identityId, roles: [role] }),
				getPersonsByIdentitySql({
					identityIds: [identityId],
					response: [{ personId, identityId, email: 'john@doe.com' }],
				}),
			),
		],
		return: {
			data: {
				addGlobalIdentityRoles: {
					ok: true,
					error: null,
				},
			},
		},
		expectedAuthLog: {
			type: 'global_role_grant',
			response: { ok: true, result: null },
			targetPersonId: personId,
			eventData: {
				before: { roles: [] },
				after: { roles: [role] },
			},
		},
	})
})

test('removes a global identity role', async () => {
	const identityId = testUuid(6)
	const personId = testUuid(7)
	const role = 'super_admin'
	await executeTenantTest({
		query: GQL`mutation {
			removeGlobalIdentityRoles(identityId: "${identityId}", roles: ["${role}"]) {
				ok
				error { code }
			}
		}`,
		executes: [
			...sqlReadCommittedTransaction(
				selectIdentitySql({ identityId, roles: [role], lock: true }),
				getIdentityProjectMembershipPresenceSql(identityId),
				patchIdentityRolesSql({ identityId, add: [], remove: [role] }),
				selectIdentitySql({ identityId, roles: [] }),
				getPersonsByIdentitySql({
					identityIds: [identityId],
					response: [{ personId, identityId, email: 'john@doe.com' }],
				}),
			),
		],
		return: {
			data: {
				removeGlobalIdentityRoles: {
					ok: true,
					error: null,
				},
			},
		},
		expectedAuthLog: {
			type: 'global_role_revoke',
			response: { ok: true, result: null },
			targetPersonId: personId,
			eventData: {
				before: { roles: [role] },
				after: { roles: [] },
			},
		},
	})
})

test('adds a defined custom role', async () => {
	const identityId = testUuid(6)
	const personId = testUuid(7)
	const role = 'support'
	await executeTenantTest({
		query: GQL`mutation {
			addGlobalIdentityRoles(identityId: "${identityId}", roles: ["${role}"]) {
				ok
				error { code }
			}
		}`,
		executes: [
			...sqlReadCommittedTransaction(
				getCustomRolesForValidationSql({
					slugs: [role],
					response: [{
						id: testUuid(50),
						slug: role,
						description: null,
						grants: [{ permission: 'person:forceSignOut', config: null }],
						created_at: new Date(),
						updated_at: new Date(),
						deleted_at: null,
					}],
				}),
				selectIdentitySql({ identityId, roles: [], lock: true }),
				getIdentityProjectMembershipPresenceSql(identityId),
				patchIdentityRolesSql({ identityId, add: [role], remove: [] }),
				selectIdentitySql({ identityId, roles: [role] }),
				getPersonsByIdentitySql({
					identityIds: [identityId],
					response: [{ personId, identityId, email: 'john@doe.com' }],
				}),
			),
		],
		return: {
			data: {
				addGlobalIdentityRoles: {
					ok: true,
					error: null,
				},
			},
		},
		expectedAuthLog: {
			type: 'global_role_grant',
			response: { ok: true, result: null },
			targetPersonId: personId,
			eventData: {
				before: { roles: [] },
				after: { roles: [role] },
			},
		},
	})
})

test('rejects an undefined custom role', async () => {
	const identityId = testUuid(6)
	await executeTenantTest({
		query: GQL`mutation {
			addGlobalIdentityRoles(identityId: "${identityId}", roles: ["ghost"]) {
				ok
				error { code }
			}
		}`,
		executes: [
			...sqlReadCommittedTransaction(
				getCustomRolesForValidationSql({ slugs: ['ghost'] }),
			),
		],
		return: (response: object) => {
			expect(response).toHaveProperty('data.addGlobalIdentityRoles.ok', false)
			expect(response).toHaveProperty('data.addGlobalIdentityRoles.error.code', 'INVALID_ROLE')
		},
	})
})

test('removes a dangling custom role slug without validation', async () => {
	const identityId = testUuid(6)
	const personId = testUuid(7)
	const role = 'deleted_role'
	await executeTenantTest({
		query: GQL`mutation {
			removeGlobalIdentityRoles(identityId: "${identityId}", roles: ["${role}"]) {
				ok
				error { code }
			}
		}`,
		executes: [
			...sqlReadCommittedTransaction(
				selectIdentitySql({ identityId, roles: [role], lock: true }),
				getIdentityProjectMembershipPresenceSql(identityId),
				patchIdentityRolesSql({ identityId, add: [], remove: [role] }),
				selectIdentitySql({ identityId, roles: [] }),
				getPersonsByIdentitySql({
					identityIds: [identityId],
					response: [{ personId, identityId, email: 'john@doe.com' }],
				}),
			),
		],
		return: {
			data: {
				removeGlobalIdentityRoles: {
					ok: true,
					error: null,
				},
			},
		},
		expectedAuthLog: {
			type: 'global_role_revoke',
			response: { ok: true, result: null },
			targetPersonId: personId,
			eventData: {
				before: { roles: [role] },
				after: { roles: [] },
			},
		},
	})
})
