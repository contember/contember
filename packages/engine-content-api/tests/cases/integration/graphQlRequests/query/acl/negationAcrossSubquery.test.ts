import { SchemaBuilder } from '@contember/schema-definition'
import { Acl, Model } from '@contember/schema'
import { test } from 'bun:test'
import { execute } from '../../../../../src/test.js'
import { GQL, SQL } from '../../../../../src/tags.js'
import { testUuid } from '../../../../../src/testUuid.js'

// An EXISTS subquery yields TRUE or FALSE, so a `not` outside it does not negate the conditions inside it. The
// masked-cell form inside the subquery depends only on the `not`s within the subquery: here one, so `eq` on a
// masked cell must stay NULL (`case when … end`) like on a real NULL, not turn into FALSE.

const schema = new SchemaBuilder()
	.entity('Author', e => e.column('name').oneHasMany('posts', r => r.target('Post').ownedBy('author')))
	.entity('Post', e => e.column('secret').column('isVisible', c => c.type(Model.ColumnType.Bool)))
	.buildSchema()

const permissions: Acl.Permissions = {
	Author: { predicates: {}, operations: { read: { id: true, name: true, posts: true } } },
	Post: {
		predicates: { visible: { isVisible: { eq: true } } },
		operations: { read: { id: true, isVisible: true, author: true, secret: 'visible' } },
	},
}

test('negation polarity restarts inside an EXISTS subquery', async () => {
	await execute({
		schema,
		permissions,
		variables: {},
		query: GQL`
        query {
          listAuthor(filter: { not: { posts: { not: { secret: { eq: "X" } } } } }) {
            id
          }
        }`,
		executes: [
			{
				sql: SQL`
					select "root_"."id" as "root_id"
					from "public"."author" as "root_"
					where not(exists (select 1 from "public"."post" as "root_posts"
						where "root_"."id" = "root_posts"."author_id"
							and not(case when coalesce("root_posts"."is_visible" = ?, false) then "root_posts"."secret" = ? end)))
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
