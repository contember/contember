import { c, createSchema } from '@contember/schema-definition'
import { test } from 'bun:test'
import { execute } from '../../../../../src/test.js'
import { GQL, SQL } from '../../../../../src/tags.js'
import { PermissionFactory } from '../../../../../../src/index.js'
import { testUuid } from '../../../../../src/testUuid.js'

/**
 * The `through` grant carries no `when`, so its predicate is plain `true` in the nested set. The
 * column is `notNull`, and the GraphQL type is shared by both scopes - emitting it as non-null on
 * the strength of the nested grant alone nulls the whole response at the root, where the grant
 * does not apply.
 */
namespace UnconditionalThrough {
	export const editorRole = c.createRole('editor')

	@c.Allow(editorRole, {
		read: ['title', 'author'],
	})
	export class Article {
		title = c.stringColumn().notNull()
		author = c.manyHasOne(Author).notNull()
	}

	@c.Allow(editorRole, {
		read: ['name'],
	})
	@c.Allow(editorRole, {
		through: true,
		read: ['secret'],
	})
	export class Author {
		name = c.stringColumn().notNull()
		secret = c.stringColumn().notNull()
	}
}

test('a not-null column granted only via an unconditional through is denied at the root, not nulled everywhere', async () => {
	const schema = createSchema(UnconditionalThrough)
	const { root, all } = new PermissionFactory().createContextual(schema, ['editor'])

	await execute({
		schema: schema.model,
		permissions: root,
		nestedPermissions: all,
		variables: {},
		query: GQL`
        query {
          listAuthor {
            name
            secret
          }
        }`,
		executes: [
			{
				sql: SQL`select "root_"."name" as "root_name", "root_"."id" as "root_id" from "public"."author" as "root_"`,
				parameters: [],
				response: {
					rows: [
						{ root_id: testUuid(10), root_name: 'John Doe' },
					],
				},
			},
		],
		return: {
			data: {
				listAuthor: [
					{ name: 'John Doe', secret: null },
				],
			},
		},
	})
})

test('the same not-null column is read over a relation', async () => {
	const schema = createSchema(UnconditionalThrough)
	const { root, all } = new PermissionFactory().createContextual(schema, ['editor'])

	await execute({
		schema: schema.model,
		permissions: root,
		nestedPermissions: all,
		variables: {},
		query: GQL`
        query {
          listArticle {
            title
            author {
              name
              secret
            }
          }
        }`,
		executes: [
			{
				sql:
					SQL`select "root_"."title" as "root_title", "root_"."author_id" as "root_author", "root_"."id" as "root_id" from "public"."article" as "root_"`,
				parameters: [],
				response: {
					rows: [
						{ root_id: testUuid(1), root_title: 'Article A', root_author: testUuid(10) },
					],
				},
			},
			{
				sql: SQL`select "root_"."id" as "root_id", "root_"."name" as "root_name", "root_"."secret" as "root_secret", "root_"."id" as "root_id" 
from "public"."author" as "root_" where "root_"."id" in (?)`,
				parameters: [testUuid(10)],
				response: {
					rows: [
						{ root_id: testUuid(10), root_name: 'John Doe', root_secret: 'shh' },
					],
				},
			},
		],
		return: {
			data: {
				listArticle: [
					{
						title: 'Article A',
						author: { name: 'John Doe', secret: 'shh' },
					},
				],
			},
		},
	})
})
