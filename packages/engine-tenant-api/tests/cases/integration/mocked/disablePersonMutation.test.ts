import { executeTenantTest } from '../../../src/testTenant.js'
import { GQL, SQL } from '../../../src/tags.js'
import { testUuid } from '../../../src/testUuid.js'
import { getPersonByIdSql } from './sql/getPersonByIdSql.js'
import { sqlTransaction } from './sql/sqlTransaction.js'
import { expect, test } from 'bun:test'

const disablePersonQuery = GQL`mutation($id: String!) {
	disablePerson(personId: $id) {
		ok
		error { code }
	}
}`

test('disablePerson revokes the account and its api keys', async () => {
	const personId = testUuid(1)
	const identityId = testUuid(2)

	await executeTenantTest({
		query: {
			query: disablePersonQuery,
			variables: { id: personId },
		},
		executes: [
			getPersonByIdSql({
				personId,
				response: { personId, identityId, password: '123', roles: [], email: 'jane@doe.com', disabledAt: null },
			}),
			...sqlTransaction(
				{
					sql: SQL`update "tenant"."person" set "disabled_at" = ? where "id" = ?`,
					parameters: [(value: unknown) => value instanceof Date, personId],
					response: { rowCount: 1 },
				},
				{
					sql: SQL`update "tenant"."api_key" set "disabled_at" = ? where "identity_id" = ?`,
					parameters: [(value: unknown) => value instanceof Date, identityId],
					response: { rowCount: 1 },
				},
			),
		],
		return: {
			data: {
				disablePerson: { ok: true, error: null },
			},
		},
		expectedAuthLog: {
			type: 'person_disable',
			targetPersonId: personId,
			response: expect.objectContaining({ ok: true }),
		},
	})
})

test('disablePerson returns PERSON_ALREADY_DISABLED', async () => {
	const personId = testUuid(1)
	const identityId = testUuid(2)

	await executeTenantTest({
		query: {
			query: disablePersonQuery,
			variables: { id: personId },
		},
		executes: [
			getPersonByIdSql({
				personId,
				response: {
					personId,
					identityId,
					password: '123',
					roles: [],
					email: 'jane@doe.com',
					disabledAt: new Date('2019-09-04 12:00'),
				},
			}),
			...sqlTransaction(),
		],
		return: {
			data: {
				disablePerson: { ok: false, error: { code: 'PERSON_ALREADY_DISABLED' } },
			},
		},
		expectedAuthLog: {
			type: 'person_disable',
			targetPersonId: personId,
			response: expect.objectContaining({ ok: false }),
		},
	})
})
