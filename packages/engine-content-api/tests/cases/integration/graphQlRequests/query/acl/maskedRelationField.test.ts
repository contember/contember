import { SchemaBuilder } from '@contember/schema-definition'
import { Acl, Model } from '@contember/schema'
import { test } from 'bun:test'
import { execute } from '../../../../../src/test.js'
import { GQL, SQL } from '../../../../../src/tags.js'
import { testUuid } from '../../../../../src/testUuid.js'

// A relation field with a read predicate stricter than its row's is projected as empty where the predicate does
// not hold, so a filter must read it as empty too: the field guard restricts the hop itself (the join condition,
// or the EXISTS), never the row next to it.

const schema = new SchemaBuilder()
	.entity(
		'Author',
		e => e.column('name').column('isPublic', c => c.type(Model.ColumnType.Bool)).oneHasMany('posts', r => r.target('Post').ownedBy('author')),
	)
	.entity('Post', e => e.column('title').column('rank', c => c.type(Model.ColumnType.Int)))
	.buildSchema()

const permissions: Acl.Permissions = {
	Author: {
		predicates: { pub: { isPublic: { eq: true } } },
		operations: { read: { id: true, name: true, isPublic: true, posts: 'pub' } },
	},
	Post: {
		predicates: { ranked: { rank: { gt: 0 } } },
		operations: { read: { id: true, title: true, rank: true, author: 'ranked' } },
	},
}

const run = async (query: string, sql: string, parameters: unknown[]) => {
	await execute({
		schema,
		permissions,
		variables: {},
		query,
		executes: [{ sql, parameters, response: { rows: [{ root_id: testUuid(1) }] } }],
		return: { data: { [query.includes('listPost') ? 'listPost' : 'listAuthor']: [{ id: testUuid(1) }] } },
	})
}

test('isNull on a masked has-one relation matches like a missing one', async () => {
	await run(
		GQL`query { listPost(filter: { author: { id: { isNull: true } } }) { id } }`,
		SQL`
			select "root_"."id" as "root_id" from "public"."post" as "root_"
			left join "public"."author" as "root_author$$" on "root_"."author_id" = "root_author$$"."id" and coalesce("root_"."rank" > ?, false)
			where "root_author$$"."id" is null
		`,
		[0],
	)
})

test('a filter through a masked has-many relation reads it empty', async () => {
	await run(
		GQL`query { listAuthor(filter: { posts: { title: { eq: "x" } } }) { id } }`,
		SQL`
			select "root_"."id" as "root_id" from "public"."author" as "root_"
			where coalesce("root_"."is_public" = ?, false)
				and exists (select 1 from "public"."post" as "root_posts$$" where "root_"."id" = "root_posts$$"."author_id" and "root_posts$$"."title" = ?)
		`,
		[true, 'x'],
	)
})

test('a column isNull through a masked has-many relation sees only the null-extended row', async () => {
	await run(
		GQL`query { listAuthor(filter: { posts: { title: { isNull: true } } }) { id } }`,
		SQL`
			select "root_"."id" as "root_id" from "public"."author" as "root_"
			where case when coalesce("root_"."is_public" = ?, false)
				then exists (select 1 from (select "root_"."id") as "root_posts$$_tmp_"
					left join "public"."post" as "root_posts$$" on "root_posts$$_tmp_"."id" = "root_posts$$"."author_id"
					where "root_posts$$"."title" is null)
				else exists (select 1 from (select "root_"."id") as "root_posts$$_tmp_"
					left join "public"."post" as "root_posts$$" on false
					where "root_posts$$"."title" is null) end
		`,
		[true],
	)
})

test('an empty condition on a masked has-many relation still tests its presence as empty', async () => {
	await run(
		GQL`query { listAuthor(filter: { posts: {} }) { id } }`,
		SQL`
			select "root_"."id" as "root_id" from "public"."author" as "root_"
			where coalesce("root_"."is_public" = ?, false)
				and exists (select 1 from "public"."post" as "root_posts$$" where "root_"."id" = "root_posts$$"."author_id")
		`,
		[true],
	)
})

test('a filter and an order by through the same masked relation do not share its join', async () => {
	// The filter's join carries the relation field guard, the order by masks it with CASE instead. Sharing one
	// join would make the result depend on which of the two is built first.
	await execute({
		schema,
		permissions: {
			...permissions,
			Author: {
				predicates: { pub: { isPublic: { eq: true } } },
				operations: { read: { id: 'pub', name: 'pub', isPublic: 'pub', posts: 'pub' } },
			},
		},
		variables: {},
		query: GQL`query { listPost(filter: { author: { name: { eq: "x" } } }, orderBy: [{ author: { name: asc } }]) { id } }`,
		executes: [{
			sql: SQL`
				select "root_"."id" as "root_id" from "public"."post" as "root_"
				left join (select "root_author$$".* from "public"."author" as "root_author$$" where "root_author$$"."is_public" = ?) as "root_author$$"
					on "root_"."author_id" = "root_author$$"."id" and coalesce("root_"."rank" > ?, false)
				left join (select "root_author$".* from "public"."author" as "root_author$" where "root_author$"."is_public" = ?) as "root_author$"
					on "root_"."author_id" = "root_author$"."id"
				where "root_author$$"."name" = ?
				order by case when "root_"."rank" > ? then "root_author$"."name" end asc, "root_"."id" asc
			`,
			parameters: [true, 0, true, 'x', 0],
			response: { rows: [{ root_id: testUuid(1) }] },
		}],
		return: { data: { listPost: [{ id: testUuid(1) }] } },
	})
})
