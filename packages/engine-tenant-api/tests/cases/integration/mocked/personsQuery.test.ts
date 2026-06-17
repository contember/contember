import { executeTenantTest } from '../../../src/testTenant.js'
import { GQL } from '../../../src/tags.js'
import { testUuid } from '../../../src/testUuid.js'
import { test } from 'bun:test'
import { listPersonsSql } from './sql/listPersonsSql.js'

test('persons query lists all persons (SUPER_ADMIN path, no filter)', async () => {
	const person1 = testUuid(1)
	const identity1 = testUuid(2)
	const person2 = testUuid(3)
	const identity2 = testUuid(4)

	await executeTenantTest({
		query: {
			query: GQL`
query {
	persons {
		id
		email
		name
		emailOtpEnabled
		identity {
			id
		}
	}
}`,
			variables: {},
		},
		executes: [
			listPersonsSql({
				rows: [
					{ personId: person1, identityId: identity1, email: 'alice@example.com', name: 'Alice', emailOtpEnabled: true },
					{ personId: person2, identityId: identity2, email: 'bob@example.com', name: 'Bob' },
				],
			}),
		],
		return: {
			data: {
				persons: [
					{ id: person1, email: 'alice@example.com', name: 'Alice', emailOtpEnabled: true, identity: { id: identity1 } },
					{ id: person2, email: 'bob@example.com', name: 'Bob', emailOtpEnabled: false, identity: { id: identity2 } },
				],
			},
		},
	})
})

test('persons query with email filter', async () => {
	const person1 = testUuid(1)
	const identity1 = testUuid(2)

	await executeTenantTest({
		query: {
			query: GQL`
query {
	persons(filter: { email: "alice" }) {
		id
		email
	}
}`,
			variables: {},
		},
		executes: [
			listPersonsSql({
				emailFilter: 'alice',
				rows: [
					{ personId: person1, identityId: identity1, email: 'alice@example.com', name: 'Alice' },
				],
			}),
		],
		return: {
			data: {
				persons: [
					{ id: person1, email: 'alice@example.com' },
				],
			},
		},
	})
})
