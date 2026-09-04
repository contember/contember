import { describe, expect, test } from 'bun:test'
import { createConnectionMock, ExpectedQuery } from '@contember/database-tester'
import { DatabaseContext, PanelAccessResolver, Providers } from '../../../src/index.js'
import { getConfigSql } from '../integration/mocked/sql/getConfigSql.js'

const identityId = '123e4567-e89b-12d3-a456-000000000001'

const providers: Providers = {
	bcrypt: () => Promise.resolve('x'),
	bcryptCompare: () => Promise.resolve(true),
	now: () => new Date('2026-08-06T12:00:00.000Z'),
	randomBytes: length => Promise.resolve(Buffer.alloc(length)),
	uuid: () => 'uuid',
	decrypt: () => {
		throw new Error('not supported')
	},
	encrypt: () => {
		throw new Error('not supported')
	},
	encryptionEnabled: false,
	hash: value => Buffer.from(value.toString()),
}

const resolve = async (queries: ExpectedQuery[], globalRoles: readonly string[]) => {
	const connection = createConnectionMock(queries)
	const db = new DatabaseContext(connection.createClient('tenant', { module: 'tenant' }), providers)
	const result = await new PanelAccessResolver(providers).isAllowed(db, identityId, globalRoles)
	expect(queries).toHaveLength(0)
	return result
}

const projectRolesSql = (roles: string[]): ExpectedQuery => ({
	sql:
		'select "project_id", "role" from "tenant"."project_membership" where "identity_id" = ? and ("lease_expires_at" is null or "lease_expires_at" > now())',
	parameters: [identityId],
	response: { rows: roles.map((role, index) => ({ project_id: `project-${index}`, role })) },
})

describe('PanelAccessResolver', () => {
	test('allows project_admin through the default global policy without reading memberships', async () => {
		expect(await resolve([getConfigSql()], ['project_admin'])).toBe(true)
	})

	test('allows a configured custom global role', async () => {
		expect(await resolve([getConfigSql({ panel_global_roles: ['project_creator'], panel_project_roles: [] })], ['project_creator'])).toBe(true)
	})

	test('denies everyone when both policy lists are empty', async () => {
		expect(await resolve([getConfigSql({ panel_global_roles: [], panel_project_roles: [] })], ['super_admin'])).toBe(false)
	})

	test('allows a matching project role and denies a non-matching role', async () => {
		expect(await resolve([getConfigSql({ panel_global_roles: [], panel_project_roles: ['admin'] }), projectRolesSql(['editor', 'admin'])], [])).toBe(
			true,
		)
		expect(await resolve([getConfigSql({ panel_global_roles: [], panel_project_roles: ['admin'] }), projectRolesSql(['editor'])], [])).toBe(false)
	})
})
