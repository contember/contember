import { SchemaBuilder } from '@contember/schema-definition'
import { Acl, Model } from '@contember/schema'
import { test } from 'bun:test'
import { execute } from '../../../../../src/test.js'
import { GQL, SQL } from '../../../../../src/tags.js'
import { testUuid } from '../../../../../src/testUuid.js'

// In the legacy join mode a many-has-many hop inside a has-many subquery is LEFT JOINed through its junction.
// The read guard of the target restricts the junction rows too: a junction row pointing to an unreadable tag
// would otherwise null-extend the tag, and `id: { isNull: true }` would tell "has a hidden tag" apart from
// "has only readable tags".

const schema = new SchemaBuilder()
	.entity('Author', e => e.column('name').oneHasMany('posts', r => r.target('Post').ownedBy('author')))
	.entity('Post', e => e.column('title').manyHasMany('tags', r => r.target('Tag')))
	.entity('Tag', e => e.column('label').column('isPublic', c => c.type(Model.ColumnType.Bool)))
	.buildSchema()

const permissions: Acl.Permissions = {
	Author: { predicates: {}, operations: { read: { id: true, name: true, posts: true } } },
	Post: { predicates: {}, operations: { read: { id: true, title: true, author: true, tags: true } } },
	Tag: {
		predicates: { pub: { isPublic: { eq: true } } },
		operations: { read: { id: 'pub', label: 'pub', isPublic: 'pub' } },
	},
}

test('a guarded many-has-many join restricts the junction to readable targets', async () => {
	await execute({
		schema,
		settings: { useExistsInHasManyFilter: false },
		permissions,
		variables: {},
		query: GQL`
        query {
          listAuthor(filter: { posts: { tags: { id: { isNull: true } } } }) {
            id
          }
        }`,
		executes: [
			{
				sql: SQL`
					select "root_"."id" as "root_id"
					from "public"."author" as "root_"
					where exists (select 1 from "public"."post" as "root_posts"
						left join (select "root_posts_x_root_posts_tags$".* from "public"."post_tags" as "root_posts_x_root_posts_tags$"
							where exists (select 1
								from (select "root_posts_tags$".* from "public"."tag" as "root_posts_tags$" where "root_posts_tags$"."is_public" = ?) as "root_posts_tags$"
								where "root_posts_tags$"."id" = "root_posts_x_root_posts_tags$"."tag_id")) as "root_posts_x_root_posts_tags$"
							on "root_posts"."id" = "root_posts_x_root_posts_tags$"."post_id"
						left join "public"."tag" as "root_posts_tags$" on "root_posts_x_root_posts_tags$"."tag_id" = "root_posts_tags$"."id"
						where "root_"."id" = "root_posts"."author_id" and "root_posts_tags$"."id" is null)
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
