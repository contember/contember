import { describe, expect, test } from 'bun:test'
import { Acl } from '@contember/schema'
import { isMaterializedViewRefreshAllowed } from '../../../src/content/GraphQlSchemaFactory.js'
import { Authorizator, PermissionFactory } from '@contember/engine-content-api'
import { SchemaBuilder } from '@contember/schema-definition'
import { emptySchema } from '@contember/schema-utils'

const createAcl = (): Acl.Schema => ({
	roles: {
		reader: { variables: {}, entities: {} },
		refresher: { variables: {}, entities: {}, content: { refreshMaterializedView: true } },
		inheritedRefresher: { variables: {}, entities: {}, inherits: ['refresher'] },
		globalRefresherWithStatsDenial: {
			variables: {},
			content: { refreshMaterializedView: true },
			entities: {
				Stats: {
					predicates: {},
					operations: { refreshMaterializedView: false },
				},
			},
		},
		statsReader: {
			variables: {},
			entities: {
				Stats: {
					predicates: {},
					operations: { read: { id: true } },
				},
			},
		},
		statsRefresher: {
			variables: {},
			entities: {
				Stats: {
					predicates: {},
					operations: { refreshMaterializedView: true },
				},
			},
		},
	},
})

const createAuthorizator = (roles: readonly string[]): Authorizator => {
	const acl = createAcl()
	const model = new SchemaBuilder()
		.entity('Stats', entity => entity.column('sum'))
		.buildSchema()
	const schema = { ...emptySchema, model, acl }
	const permissions = new PermissionFactory().create(schema, roles)
	return new Authorizator(permissions, false, isMaterializedViewRefreshAllowed(acl, roles))
}

describe('materialized view refresh permission', () => {
	test('does not inherit permission from unrelated project roles', () => {
		expect(isMaterializedViewRefreshAllowed(createAcl(), ['reader'])).toBe(false)
	})

	test('allows an assigned role', () => {
		expect(isMaterializedViewRefreshAllowed(createAcl(), ['refresher'])).toBe(true)
	})

	test('allows an inherited role', () => {
		expect(isMaterializedViewRefreshAllowed(createAcl(), ['inheritedRefresher'])).toBe(true)
	})

	test('keeps an entity denial over the global fallback when another role only grants read', () => {
		const authorizator = createAuthorizator(['globalRefresherWithStatsDenial', 'statsReader'])
		expect(authorizator.isRefreshMaterializedViewAllowed('Stats')).toBe(false)
	})

	test('allows an entity when another effective role explicitly grants refresh', () => {
		const authorizator = createAuthorizator(['globalRefresherWithStatsDenial', 'statsReader', 'statsRefresher'])
		expect(authorizator.isRefreshMaterializedViewAllowed('Stats')).toBe(true)
	})
})
