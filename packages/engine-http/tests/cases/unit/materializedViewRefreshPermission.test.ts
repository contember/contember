import { describe, expect, test } from 'bun:test'
import { Acl } from '@contember/schema'
import { isMaterializedViewRefreshAllowed } from '../../../src/content/GraphQlSchemaFactory.js'

const createAcl = (): Acl.Schema => ({
	roles: {
		reader: { variables: {}, entities: {} },
		refresher: { variables: {}, entities: {}, content: { refreshMaterializedView: true } },
		inheritedRefresher: { variables: {}, entities: {}, inherits: ['refresher'] },
	},
})

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
})
