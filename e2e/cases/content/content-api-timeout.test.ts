import { expect, test } from 'bun:test'
import { createTester, gql } from '../../src/tester'
import { createSchema, c } from '@contember/schema-definition'

namespace TimeoutModel {
	@c.View(`select 'a1767dd9-2e5c-44da-a6be-07bb46b8e275' as id, 'foo' as value from (values(PG_SLEEP(60))) t`)
	export class Foo {
		value = c.stringColumn()
	}
}

test('Content API: read timeout', async () => {
	const tester = await createTester(createSchema(TimeoutModel))

	const start = Date.now()
	await tester(
		gql`
			query {
                listFoo {
					value
                }
			}
		`,
	)
		.expect(500)
		.expect(() => {
			// max 5500 ms
			expect(Date.now() - start).toBeLessThan(5500)
		})
})
