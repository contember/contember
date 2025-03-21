import { test } from 'bun:test'
import { createTester, gql } from '../../src/tester'
import { c, createSchema } from '@contember/schema-definition'

// null uuid
const id = '00000000-0000-0000-0000-000000000000'

namespace MaterializedViewTest {
	export class Value {
		value = c.intColumn()
	}

	@c.View(`SELECT '${id}'::uuid AS id, COALESCE(SUM(value), 0) AS sum FROM value`, {
		materialized: true,
	})
	@c.Unique({ fields: ['id'], index: true })
	export class Stats {
		id = c.uuidColumn().notNull()
		sum = c.intColumn()
	}
}

test('Content API: materialized view', async () => {
	const tester = await createTester(createSchema(MaterializedViewTest))


	await tester(
		gql`
            mutation {
                a: createValue(data: { value: 1 }) {
                    ok
                }
                b: createValue(data: { value: 2 }) {
                    ok
                }
            }
		`,
	)
		.expect({
			data: {
				a: { ok: true },
				b: { ok: true },
			},
		})
		.expect(200)

	// outdated
	await tester(
		gql`
            query {
                listStats {
                    sum
                }
            }`,
	)
		.expect({
			data: {
				listStats: [{ sum: 0 }],
			},
		})
		.expect(200)

	// refresh
	await tester(
		gql`
			mutation {
                refreshMaterializedView(name: Stats, options: {concurrently: true}) {
					ok
                }
			}
		`,
	).expect({
		data: {
			refreshMaterializedView: { ok: true },
		},
	})

	// updated
	await tester(
		gql`
            query {
                listStats {
                    sum
                }
            }`,
	)
		.expect({
			data: {
				listStats: [{ sum: 3 }],
			},
		})
		.expect(200)
})
