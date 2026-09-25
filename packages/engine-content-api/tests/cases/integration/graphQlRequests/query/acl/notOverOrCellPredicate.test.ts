import { SchemaBuilder } from '@contember/schema-definition'
import { Acl, Model } from '@contember/schema'
import { test } from 'bun:test'
import { execute } from '../../../../../src/test.js'
import { GQL, SQL } from '../../../../../src/tags.js'
import { testUuid } from '../../../../../src/testUuid.js'

// A guarded cell condition is lowered as `cond AND guard`, with the AND placed INSIDE any surrounding `not`,
// next to the field condition:
//     not( (secret_a = X AND visible_a) OR (secret_b = Y AND visible_b) )
// These tests pin that lowering at the SQL level for the `NOT(A OR B)` and single-field `NOT` shapes.
//
// KNOWN LIMITATION — this lowering is value-safe only while the guard evaluates to FALSE, not NULL:
//   guard FALSE: `secret_a = X AND false` is a value-INDEPENDENT constant false, so negating it cannot turn the
//                unreadable value into a row-inclusion signal.
//   guard NULL:  SQL three-valued logic makes it value-DEPENDENT — verified on PG 16,
//                `not('X'='X' and null)` is NULL (row excluded) while `not('Y'='X' and null)` is TRUE (included),
//                so `NOT` over a nullable guard column is a bisection oracle over the masked cell.
// A guard is NULL whenever its column is nullable (as `visibleA`/`visibleB` are below) or whenever a to-one hop
// it traverses is absent. Closing this needs the guard lowered as `<guard> IS TRUE`, which is a SQL-shape change
// across every consumer — it belongs to the readable-view follow-up, not here. Declaring guard columns `notNull`
// avoids it in the meantime.

const schema = new SchemaBuilder()
	.entity('Author', e =>
		e
			.column('secretA')
			.column('secretB')
			.column('visibleA', c => c.type(Model.ColumnType.Bool))
			.column('visibleB', c => c.type(Model.ColumnType.Bool)))
	.buildSchema()

const permissions: Acl.Permissions = {
	Author: {
		predicates: {
			// two DIFFERENT cell-level read guards
			guardA: { visibleA: { eq: true } },
			guardB: { visibleB: { eq: true } },
		},
		operations: {
			read: {
				id: true, // row is always readable -> keeps WHERE free of row-level noise
				visibleA: true,
				visibleB: true,
				secretA: 'guardA',
				secretB: 'guardB',
			},
		},
	},
}

test('NOT(A OR B) over two differently-guarded cells keeps each guard beside its field condition', async () => {
	await execute({
		schema,
		permissions,
		variables: {},
		query: GQL`
        query {
          listAuthor(filter: { not: { or: [ { secretA: { eq: "X" } }, { secretB: { eq: "Y" } } ] } }) {
            id
          }
        }`,
		executes: [
			{
				sql: SQL`
					select "root_"."id" as "root_id"
					from "public"."author" as "root_"
					where not(("root_"."secret_a" = ? and "root_"."visible_a" = ? or "root_"."secret_b" = ? and "root_"."visible_b" = ?))
				`,
				parameters: ['X', true, 'Y', true],
				response: { rows: [{ root_id: testUuid(1) }] },
			},
		],
		return: {
			data: {
				listAuthor: [{ id: testUuid(1) }],
			},
		},
	})
})

test('single-field NOT over a guarded cell keeps the guard inside the negation', async () => {
	await execute({
		schema,
		permissions,
		variables: {},
		query: GQL`
        query {
          listAuthor(filter: { not: { secretA: { eq: "X" } } }) {
            id
          }
        }`,
		executes: [
			{
				sql: SQL`
					select "root_"."id" as "root_id"
					from "public"."author" as "root_"
					where not("root_"."secret_a" = ? and "root_"."visible_a" = ?)
				`,
				parameters: ['X', true],
				response: { rows: [{ root_id: testUuid(1) }] },
			},
		],
		return: {
			data: {
				listAuthor: [{ id: testUuid(1) }],
			},
		},
	})
})
