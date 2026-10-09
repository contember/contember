import { test } from 'bun:test'
import { execute, failedTransaction } from '../../../../../src/test.js'
import { c, createSchema } from '@contember/schema-definition'
import { PermissionFactory } from '../../../../../../src/index.js'
import { GQL, SQL } from '../../../../../src/tags.js'
import { testUuid } from '../../../../../src/testUuid.js'

/**
 * `upsert` is a root entry point for both update and create, so a `through` grant on either half
 * must not open it. `Article` misses the root create, `Tag` misses the root update.
 */
namespace UpsertRootGating {
	export const editor = c.createRole('editor')

	@c.Allow(editor, { read: ['id', 'title'], update: ['title'] })
	@c.Allow(editor, { through: true, create: ['title'] })
	export class Article {
		title = c.stringColumn()
	}

	@c.Allow(editor, { read: ['id', 'name'], create: ['name'] })
	@c.Allow(editor, { through: true, update: ['name'] })
	export class Tag {
		name = c.stringColumn()
	}
}

test('through-only create grant opens no root upsert mutation', async () => {
	const schema = createSchema(UpsertRootGating)
	const { root, all } = new PermissionFactory().createContextual(schema, ['editor'])

	// `updateArticle` is in the same document on purpose - only `upsertArticle` may be reported missing.
	await execute({
		schema: schema.model,
		permissions: root,
		nestedPermissions: all,
		query: GQL`mutation {
        a: updateArticle(by: {id: "${testUuid(1)}"}, data: {title: "Hello"}) {
          ok
        }
        b: upsertArticle(by: {id: "${testUuid(1)}"}, update: {title: "Hello"}, create: {title: "Hello"}) {
          ok
        }
      }`,
		executes: [],
		return: {
			errors: [{ message: 'Cannot query field "upsertArticle" on type "Mutation". Did you mean "updateArticle"?' }],
		},
	})
})

test('through-only update grant opens no root upsert mutation', async () => {
	const schema = createSchema(UpsertRootGating)
	const { root, all } = new PermissionFactory().createContextual(schema, ['editor'])

	// `createTag` is in the same document on purpose - only `upsertTag` may be reported missing.
	await execute({
		schema: schema.model,
		permissions: root,
		nestedPermissions: all,
		query: GQL`mutation {
        a: createTag(data: {name: "Hello"}) {
          ok
        }
        b: upsertTag(by: {id: "${testUuid(1)}"}, update: {name: "Hello"}, create: {name: "Hello"}) {
          ok
        }
      }`,
		executes: [],
		return: {
			errors: [{ message: 'Cannot query field "upsertTag" on type "Mutation".' }],
		},
	})
})

/** The root `upsert` exists, but its update branch still runs in the root scope. */
namespace UpsertRootScope {
	export const editor = c.createRole('editor')

	@c.Allow(editor, { read: ['id', 'slug', 'name'], create: ['slug', 'name'], update: ['name'] })
	@c.Allow(editor, { through: true, update: ['secret'] })
	export class Author {
		name = c.stringColumn()
		secret = c.stringColumn()
		slug = c.stringColumn().unique()
	}
}

test('root upsert denies a field granted only through a relation', async () => {
	const schema = createSchema(UpsertRootScope)
	const { root, all } = new PermissionFactory().createContextual(schema, ['editor'])

	await execute({
		schema: schema.model,
		permissions: root,
		nestedPermissions: all,
		query: GQL`mutation {
        upsertAuthor(
            by: {slug: "john"},
            update: {secret: "hidden"},
            create: {slug: "john", name: "John"}
          ) {
          ok
          errors {
            type
          }
        }
      }`,
		executes: [
			...failedTransaction([
				{
					sql: SQL`select "root_"."id" from "public"."author" as "root_" where "root_"."slug" = ?`,
					parameters: ['john'],
					response: { rows: [{ id: testUuid(2) }] },
				},
				{
					sql:
						SQL`with "newData_" as (select ? :: text as "secret", "root_"."secret" as "secret_old__", "root_"."id", "root_"."name", "root_"."slug"  from "public"."author" as "root_"  where false)
						update  "public"."author" set  "secret" =  "newData_"."secret"   from "newData_"  where "author"."id" = "newData_"."id" and false  returning "secret_old__"`,
					parameters: ['hidden'],
					response: { rows: [] },
				},
			]),
		],
		return: {
			data: {
				upsertAuthor: {
					ok: false,
					errors: [{ type: 'NotFoundOrDenied' }],
				},
			},
		},
	})
})
