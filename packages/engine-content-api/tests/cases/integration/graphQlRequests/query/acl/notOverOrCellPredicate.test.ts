import { SchemaBuilder } from '@contember/schema-definition'
import { Acl, Model } from '@contember/schema'
import { test } from 'bun:test'
import { execute } from '../../../../../src/test.js'
import { GQL, SQL } from '../../../../../src/tags.js'
import { testUuid } from '../../../../../src/testUuid.js'

// A condition on a guarded cell holds on a masked cell iff it holds on NULL. Under a negation an `eq` on a masked
// cell must stay NULL like on a real NULL, so it compiles to `case when coalesce(guard, false) then cond end`:
// neither the masked value nor a NULL guard (a nullable guard column, or an absent to-one hop it traverses) can
// turn into a row-inclusion signal. Outside a negation it stays `cond AND guard`, which keeps it sargable.

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
					where not((case when coalesce("root_"."visible_a" = ?, false) then "root_"."secret_a" = ? end or case when coalesce("root_"."visible_b" = ?, false) then "root_"."secret_b" = ? end))
				`,
				parameters: [true, 'X', true, 'Y'],
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
					where not(case when coalesce("root_"."visible_a" = ?, false) then "root_"."secret_a" = ? end)
				`,
				parameters: [true, 'X'],
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

test('isNull on a guarded cell matches a masked cell like a NULL', async () => {
	await execute({
		schema,
		permissions,
		variables: {},
		query: GQL`
        query {
          listAuthor(filter: { secretA: { isNull: true } }) {
            id
          }
        }`,
		executes: [
			{
				sql: SQL`
					select "root_"."id" as "root_id"
					from "public"."author" as "root_"
					where ("root_"."secret_a" is null or not coalesce("root_"."visible_a" = ?, false))
				`,
				parameters: [true],
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

test('a guarded cell condition keeps the optimization of its sibling conditions', async () => {
	// `{ and: [], not: { or: [] } }` optimizes to FALSE on its own; the masked atom must not change that.
	await execute({
		schema,
		permissions,
		variables: {},
		query: GQL`
        query {
          listAuthor(filter: { and: [], secretA: { eq: "X" }, not: { or: [] } }) {
            id
          }
        }`,
		executes: [
			{
				sql: SQL`select "root_"."id" as "root_id" from "public"."author" as "root_" where false`,
				parameters: [],
				response: { rows: [] },
			},
		],
		return: {
			data: {
				listAuthor: [],
			},
		},
	})
})
