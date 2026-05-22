import { describe, expect, test } from 'bun:test'
import { TenantDbPolicyProvider } from '../../../src/model/policy'
import type { DatabaseContext } from '../../../src/model/utils'

/**
 * Verifies that the per-request provider hits the DB once per instance even if
 * called many times. Each resolver call to `requireAction` would otherwise add
 * extra roundtrips.
 */
describe('TenantDbPolicyProvider caching', () => {
	const makeDb = (counter: { count: number }): DatabaseContext => {
		const db = {
			queryHandler: {
				fetch: async () => {
					counter.count++
					return []
				},
			},
		}
		return db as any
	}

	test('fetches statements only once across many getStatements calls', async () => {
		const counter = { count: 0 }
		const db = makeDb(counter)
		const provider = new TenantDbPolicyProvider(db, { id: 'id', roles: ['super_admin'] })

		await provider.getStatements({})
		await provider.getStatements({})
		await provider.getStatements({})

		// Built-ins now come from code. With no assignments returned,
		// only IdentityPolicyAssignmentsQuery fires — one roundtrip total.
		expect(counter.count).toBe(1)
	})

	test('concurrent callers share the in-flight promise', async () => {
		const counter = { count: 0 }
		const db = makeDb(counter)
		const provider = new TenantDbPolicyProvider(db, { id: 'id', roles: ['super_admin'] })

		await Promise.all([
			provider.getStatements({}),
			provider.getStatements({}),
			provider.getStatements({}),
		])

		expect(counter.count).toBe(1)
	})

	test('separate provider instances do not share cache', async () => {
		const counter = { count: 0 }
		const db = makeDb(counter)
		const p1 = new TenantDbPolicyProvider(db, { id: 'id', roles: ['super_admin'] })
		const p2 = new TenantDbPolicyProvider(db, { id: 'id', roles: ['super_admin'] })

		await p1.getStatements({})
		await p2.getStatements({})

		expect(counter.count).toBe(2)
	})
})
