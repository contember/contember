import { test } from 'bun:test'
import { execute, sqlTransaction } from '../../../../../src/test.js'
import { Model } from '@contember/schema'
import { SchemaBuilder } from '@contember/schema-definition'
import { GQL, SQL } from '../../../../../src/tags.js'
import { testUuid } from '../../../../../src/testUuid.js'

/**
 * `Author.name` is updatable only through a relation. The root permission set does not carry the
 * grant at all, so this only works if the write path resolves its predicates against the nested set
 * once it descends into `Post.author`.
 */
const schema = new SchemaBuilder()
	.entity('Author', e => e.column('name', c => c.type(Model.ColumnType.String)))
	.entity('Post', e =>
		e.column('title', c => c.type(Model.ColumnType.String))
			.manyHasOne('author', r => r.target('Author')))
	.buildSchema()

const rootPermissions = {
	Post: {
		predicates: {},
		operations: {
			read: { id: true },
			update: { id: true, author: true },
		},
	},
	Author: {
		predicates: {},
		operations: {
			read: { id: true },
		},
	},
}

const nestedPermissions = {
	Post: rootPermissions.Post,
	Author: {
		predicates: {},
		operations: {
			read: { id: true },
			update: { id: true, name: true },
		},
	},
}

test('nested update uses a grant the root permission set does not carry', async () => {
	await execute({
		schema,
		permissions: rootPermissions,
		nestedPermissions,
		query: GQL`mutation {
        updatePost(
            by: {id: "${testUuid(1)}"},
            data: {author: {update: {name: "John"}}}
          ) {
          ok
        }
      }`,
		executes: [
			...sqlTransaction([
				{
					sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`select "root_"."author_id" from "public"."post" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ author_id: testUuid(2) }] },
				},
				{
					sql:
						SQL`with "newData_" as (select ? :: text as "name", "root_"."name" as "name_old__", "root_"."id"  from "public"."author" as "root_"  where "root_"."id" = ?)
						update  "public"."author" set  "name" =  "newData_"."name"   from "newData_"  where "author"."id" = "newData_"."id"  returning "name_old__"`,
					parameters: ['John', testUuid(2)],
					response: { rows: [{ name_old__: 'Jack' }] },
				},
			]),
		],
		return: {
			data: {
				updatePost: {
					ok: true,
				},
			},
		},
	})
})
