import { SchemaBuilder } from '@contember/schema-definition'
import { Acl, Input, Model } from '@contember/schema'
import { describe, test } from 'bun:test'
import { execute } from '../../../../../src/test.js'
import { GQL, SQL } from '../../../../../src/tags.js'

// A relation `isNull` next to sibling conditions in the same relation object means "no (readable) related
// row, and the siblings hold on the null-extended row" — what a LEFT JOIN of an absent relation evaluates.
// The siblings must never move into the NOT EXISTS: `{ id: { isNull: true }, name: { eq } }` would then match
// a present row whose name differs. On the null row they are evaluated in three-valued logic, so
// `name = ?` is NULL there, also under `not`.

const schema = new SchemaBuilder()
	.entity('Post', e => e.column('title').manyHasOne('author', r => r.target('Author').inversedBy('posts')))
	.entity('Author', e => e.column('name').column('isPublic', c => c.type(Model.ColumnType.Bool)))
	.buildSchema()

const restrictedPermissions: Acl.Permissions = {
	Post: { predicates: {}, operations: { read: { id: true, title: true, author: true } } },
	Author: {
		predicates: { pub: { isPublic: { eq: true } } },
		operations: { read: { id: 'pub', name: 'pub', isPublic: 'pub', posts: 'pub' } },
	},
}

const runFilter = async (args: {
	entity: 'Post' | 'Author'
	filter: Input.OptionalWhere
	permissions?: Acl.Permissions
	sql: string
	parameters: unknown[]
}) => {
	await execute({
		schema,
		permissions: args.permissions,
		variables: {},
		query: GQL`
			query($filter: ${args.entity}Where) {
				list${args.entity}(filter: $filter) {
					id
				}
			}`,
		queryVariables: { filter: args.filter },
		executes: [{ sql: args.sql, parameters: args.parameters, response: { rows: [] } }],
		return: { data: { [`list${args.entity}`]: [] } },
	})
}

const authorExists = `exists (select 1 from "public"."author" as "root_author" where "root_"."author_id" = "root_author"."id")`
const nullAuthor = `from (select 1) as "root_author_null_" left join "public"."author" as "root_author" on false`

const guardedAuthorExists =
	`exists (select 1 from "public"."author" as "root_author$" where "root_"."author_id" = "root_author$"."id" and "root_author$"."is_public" = ?)`
const nullGuardedAuthor = `from (select 1) as "root_author$_null_" left join "public"."author" as "root_author$" on false`

describe('relation isNull with sibling conditions, unrestricted role', () => {
	test('isNull sibling is evaluated on the null-extended row', async () => {
		await runFilter({
			entity: 'Post',
			filter: { author: { id: { isNull: true }, name: { isNull: true } } },
			sql: SQL`select "root_"."id" as "root_id" from "public"."post" as "root_"
				where not(${authorExists}) and (select "root_author"."name" is null ${nullAuthor})`,
			parameters: [],
		})
	})

	test('a negated sibling stays NULL on the null-extended row', async () => {
		await runFilter({
			entity: 'Post',
			filter: { author: { id: { isNull: true }, not: { name: { eq: 'x' } } } },
			sql: SQL`select "root_"."id" as "root_id" from "public"."post" as "root_"
				where not(${authorExists}) and (select not("root_author"."name" = ?) ${nullAuthor})`,
			parameters: ['x'],
		})
	})

	test('negated absence with a sibling does not turn into a presence test of the sibling', async () => {
		await runFilter({
			entity: 'Post',
			filter: { author: { not: { id: { isNull: true }, name: { eq: 'x' } } } },
			sql: SQL`select "root_"."id" as "root_id" from "public"."post" as "root_"
				where not(not(${authorExists}) and (select "root_author"."name" = ? ${nullAuthor}))`,
			parameters: ['x'],
		})
	})

	test('has-many absence with a sibling', async () => {
		await runFilter({
			entity: 'Author',
			filter: { posts: { id: { isNull: true }, title: { isNull: true } } },
			sql: SQL`select "root_"."id" as "root_id" from "public"."author" as "root_"
				where not(exists (select 1 from "public"."post" as "root_posts" where "root_"."id" = "root_posts"."author_id"))
				and (select "root_posts"."title" is null from (select 1) as "root_posts_null_" left join "public"."post" as "root_posts" on false)`,
			parameters: [],
		})
	})
})

describe('relation isNull with sibling conditions, role with a read predicate on the target', () => {
	test('isNull sibling is evaluated on the null-extended row, an unreadable author is absent', async () => {
		await runFilter({
			entity: 'Post',
			filter: { author: { id: { isNull: true }, name: { isNull: true } } },
			permissions: restrictedPermissions,
			sql: SQL`select "root_"."id" as "root_id" from "public"."post" as "root_"
				where not(${guardedAuthorExists}) and (select "root_author$"."name" is null ${nullGuardedAuthor})`,
			parameters: [true],
		})
	})

	test('a negated sibling stays NULL on the null-extended row', async () => {
		await runFilter({
			entity: 'Post',
			filter: { author: { id: { isNull: true }, not: { name: { eq: 'x' } } } },
			permissions: restrictedPermissions,
			sql: SQL`select "root_"."id" as "root_id" from "public"."post" as "root_"
				where not(${guardedAuthorExists}) and (select not("root_author$"."name" = ?) ${nullGuardedAuthor})`,
			parameters: [true, 'x'],
		})
	})

	test('negated absence with a sibling', async () => {
		await runFilter({
			entity: 'Post',
			filter: { author: { not: { id: { isNull: true }, name: { eq: 'x' } } } },
			permissions: restrictedPermissions,
			sql: SQL`select "root_"."id" as "root_id" from "public"."post" as "root_"
				where not(not(${guardedAuthorExists}) and (select "root_author$"."name" = ? ${nullGuardedAuthor}))`,
			parameters: [true, 'x'],
		})
	})

	test('has-many absence with a sibling', async () => {
		await runFilter({
			entity: 'Author',
			filter: { posts: { id: { isNull: true }, title: { isNull: true } } },
			permissions: restrictedPermissions,
			sql: SQL`select "root_"."id" as "root_id" from "public"."author" as "root_"
				where not(exists (select 1 from "public"."post" as "root_posts" where "root_"."id" = "root_posts"."author_id"))
				and (select "root_posts"."title" is null from (select 1) as "root_posts_null_" left join "public"."post" as "root_posts" on false)
				and "root_"."is_public" = ?`,
			parameters: [true],
		})
	})
})
