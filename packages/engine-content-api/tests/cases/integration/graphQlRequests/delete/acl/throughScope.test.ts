import { test } from 'bun:test'
import { execute, failedTransaction, sqlTransaction } from '../../../../../src/test.js'
import { c, createSchema } from '@contember/schema-definition'
import { PermissionFactory } from '../../../../../../src/index.js'
import { GQL, SQL } from '../../../../../src/tags.js'
import { testUuid } from '../../../../../src/testUuid.js'

/**
 * `Post` may be deleted only through `Author.posts`. The root permission set carries no delete grant
 * for it at all, so a nested delete works only if `DeleteExecutor` resolves its predicate against
 * the nested set.
 */
namespace NestedDelete {
	export const editor = c.createRole('editor')

	@c.Allow(editor, {
		read: ['id'],
		update: ['id', 'posts'],
	})
	export class Author {
		posts = c.oneHasMany(Post, 'author')
	}

	@c.Allow(editor, {
		read: ['id', 'author'],
	})
	@c.Allow(editor, {
		through: true,
		update: ['author'],
	})
	@c.Allow(editor, {
		through: true,
		when: { locked: { eq: false } },
		delete: true,
	})
	export class Post {
		locked = c.boolColumn().notNull()
		author = c.manyHasOne(Author, 'posts').notNull()
	}
}

const nestedDeleteSchema = createSchema(NestedDelete)
const nestedDeletePermissions = new PermissionFactory().createContextual(nestedDeleteSchema, ['editor'])

test('nested delete uses a delete grant the root permission set does not carry', async () => {
	await execute({
		schema: nestedDeleteSchema.model,
		permissions: nestedDeletePermissions.root,
		nestedPermissions: nestedDeletePermissions.all,
		query: GQL`mutation {
        updateAuthor(
            by: {id: "${testUuid(1)}"},
            data: {posts: [{delete: {id: "${testUuid(2)}"}}]}
          ) {
          ok
        }
      }`,
		executes: [
			...sqlTransaction([
				{
					sql: SQL`select "root_"."id" from "public"."author" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ? and "root_"."author_id" = ?`,
					parameters: [testUuid(2), testUuid(1)],
					response: { rows: [{ id: testUuid(2) }] },
				},
				{
					// the through grant's own predicate - the root set has no delete grant, which would be `false as "allowed"`
					sql: SQL`select "root_"."id" as "id", "root_"."locked" = ? as "allowed" from "public"."post" as "root_" where "root_"."id" = ?`,
					parameters: [false, testUuid(2)],
					response: { rows: [{ id: testUuid(2), allowed: true }] },
				},
				{
					sql: SQL`delete from "public"."post" where "id" in (?)`,
					parameters: [testUuid(2)],
					response: {},
				},
			]),
		],
		return: {
			data: {
				updateAuthor: {
					ok: true,
				},
			},
		},
	})
})

test('a through-only delete grant opens no root delete mutation', async () => {
	await execute({
		schema: nestedDeleteSchema.model,
		permissions: nestedDeletePermissions.root,
		nestedPermissions: nestedDeletePermissions.all,
		query: GQL`mutation {
        deletePost(by: {id: "${testUuid(2)}"}) {
          ok
        }
      }`,
		executes: [],
		return: {
			errors: [
				{ message: 'Cannot query field "deletePost" on type "Mutation".' },
			],
		},
	})
})

/**
 * A cascade keeps the scope of the delete that started it. `Item` may be deleted only through a
 * relation, so a root `deleteCategory` cascading into it stays denied - the cascade must not
 * escalate to the nested set as it descends.
 */
namespace CascadeScope {
	export const editor = c.createRole('editor')

	@c.Allow(editor, {
		read: ['id'],
		delete: true,
	})
	export class Category {
		title = c.stringColumn()
	}

	@c.Allow(editor, {
		read: ['id', 'category'],
	})
	@c.Allow(editor, {
		through: true,
		delete: true,
	})
	export class Item {
		category = c.manyHasOne(Category).cascadeOnDelete()
	}
}

const cascadeScopeSchema = createSchema(CascadeScope)
const cascadeScopePermissions = new PermissionFactory().createContextual(cascadeScopeSchema, ['editor'])

test('a cascade of a root delete stays at root scope and does not pick up a through grant', async () => {
	await execute({
		schema: cascadeScopeSchema.model,
		permissions: cascadeScopePermissions.root,
		nestedPermissions: cascadeScopePermissions.all,
		query: GQL`mutation {
        deleteCategory(by: {id: "${testUuid(1)}"}) {
          ok
          errorMessage
        }
      }`,
		executes: [
			...failedTransaction([
				{
					sql: SQL`select "root_"."id" from "public"."category" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`select "root_"."id" as "id", true as "allowed" from "public"."category" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1), allowed: true }] },
				},
				{
					// `false as "allowed"`: the cascade still evaluates Item at root scope, where it has no delete grant
					sql:
						SQL`select "root_"."id" as "id", "root_"."category_id" as "ref", false as "allowed" from "public"."item" as "root_" where "root_"."category_id" in (?)`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(2), ref: testUuid(1), allowed: false }] },
				},
			]),
		],
		return: {
			data: {
				deleteCategory: {
					ok: false,
					errorMessage: 'Execution has failed:\n'
						+ 'unknown field: ForeignKeyConstraintViolation (Cannot delete 123e4567-e89b-12d3-a456-000000000001 row(s) of entity Category, '
						+ 'because it is still referenced from 123e4567-e89b-12d3-a456-000000000002 row(s) of entity Item in relation category. '
						+ 'OnDelete behaviour of this relation is set to "cascade". This is possibly caused by ACL denial.)',
				},
			},
		},
	})
})

/**
 * Unlinking `Entry.blog` is granted only through the relation, so the update that nulls the joining
 * column has to resolve its predicate in the nested scope.
 */
namespace NestedDisconnect {
	export const editor = c.createRole('editor')

	@c.Allow(editor, {
		read: ['id'],
		update: ['id', 'entries'],
	})
	export class Blog {
		entries = c.oneHasMany(Entry, 'blog')
	}

	@c.Allow(editor, {
		read: ['id', 'blog'],
	})
	@c.Allow(editor, {
		through: true,
		when: { archived: { eq: true } },
		update: ['blog'],
	})
	export class Entry {
		archived = c.boolColumn().notNull()
		blog = c.manyHasOne(Blog, 'entries')
	}
}

const nestedDisconnectSchema = createSchema(NestedDisconnect)
const nestedDisconnectPermissions = new PermissionFactory().createContextual(nestedDisconnectSchema, ['editor'])

test('nested disconnect resolves the update predicate in the nested scope', async () => {
	await execute({
		schema: nestedDisconnectSchema.model,
		permissions: nestedDisconnectPermissions.root,
		nestedPermissions: nestedDisconnectPermissions.all,
		query: GQL`mutation {
        updateBlog(
            by: {id: "${testUuid(1)}"},
            data: {entries: [{disconnect: {id: "${testUuid(2)}"}}]}
          ) {
          ok
        }
      }`,
		executes: [
			...sqlTransaction([
				{
					sql: SQL`select "root_"."id" from "public"."blog" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`select "root_"."id" from "public"."entry" as "root_" where "root_"."id" = ? and "root_"."blog_id" = ?`,
					parameters: [testUuid(2), testUuid(1)],
					response: { rows: [{ id: testUuid(2) }] },
				},
				{
					// `"root_"."archived" = ?` is the through grant's predicate; at root scope `Entry.blog` has no update grant at all
					sql:
						SQL`with "newData_" as (select ? :: uuid as "blog_id", "root_"."blog_id" as "blog_id_old__", "root_"."id", "root_"."archived" from "public"."entry" as "root_" where "root_"."id" = ? and "root_"."archived" = ?)
						update "public"."entry" set "blog_id" = "newData_"."blog_id" from "newData_" where "entry"."id" = "newData_"."id" and "newData_"."archived" = ? returning "blog_id_old__"`,
					parameters: [null, testUuid(2), true, true],
					response: { rows: [{ blog_id_old__: testUuid(1) }] },
				},
			]),
		],
		return: {
			data: {
				updateBlog: {
					ok: true,
				},
			},
		},
	})
})
