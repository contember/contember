import { test } from 'bun:test'
import { execute, sqlTransaction } from '../../../../../src/test.js'
import { c, createSchema } from '@contember/schema-definition'
import { PermissionFactory } from '../../../../../../src/index.js'
import { GQL, SQL } from '../../../../../src/tags.js'
import { testUuid } from '../../../../../src/testUuid.js'

/**
 * Every entity below `Post` is readable only through a relation - it has no root grant at all. A nested
 * by-unique lookup must therefore resolve in the nested scope; resolved in the root scope it finds nothing.
 * The predicates make the nested scope visible in the SQL.
 */
namespace NoRootRead {
	export const editor = c.createRole('editor')

	@c.Allow(editor, {
		read: ['id'],
		update: ['id', 'category', 'comments', 'tags'],
	})
	export class Post {
		category = c.manyHasOne(Category)
		comments = c.oneHasMany(Comment, 'post')
		tags = c.manyHasMany(Tag)
	}

	@c.Allow(editor, {
		through: true,
		when: { visible: { eq: true } },
		read: ['id', 'name', 'badge'],
		create: ['id', 'name'],
		update: ['badge'],
	})
	export class Category {
		name = c.stringColumn()
		visible = c.boolColumn().notNull().default(true)
		badge = c.oneHasOne(Badge)
	}

	@c.Allow(editor, {
		through: true,
		when: { locked: { eq: false } },
		read: ['id', 'note'],
		update: ['note'],
	})
	export class Badge {
		note = c.stringColumn()
		locked = c.boolColumn().notNull()
	}

	@c.Allow(editor, {
		through: true,
		when: { approved: { eq: true } },
		read: ['id', 'text', 'post'],
		create: ['id', 'text', 'post'],
		update: ['text', 'post'],
		delete: true,
	})
	export class Comment {
		text = c.stringColumn()
		approved = c.boolColumn().notNull().default(true)
		post = c.manyHasOne(Post, 'comments').notNull()
	}

	@c.Allow(editor, {
		through: true,
		when: { hidden: { eq: false } },
		read: ['id'],
	})
	export class Tag {
		hidden = c.boolColumn().notNull()
	}
}

const schema = createSchema(NoRootRead)
const permissions = new PermissionFactory().createContextual(schema, ['editor'])

const postLookup = {
	sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?`,
	parameters: [testUuid(1)],
	response: { rows: [{ id: testUuid(1) }] },
}

const run = (query: string, executes: Parameters<typeof execute>[0]['executes'], ok = true) =>
	execute({
		schema: schema.model,
		permissions: permissions.root,
		nestedPermissions: permissions.all,
		query,
		executes,
		return: { data: { updatePost: { ok } } },
	})

test('nested connect looks the target up in the nested scope', async () => {
	await run(
		GQL`mutation {
			updatePost(by: {id: "${testUuid(1)}"}, data: {category: {connect: {id: "${testUuid(2)}"}}}) { ok }
		}`,
		sqlTransaction([
			postLookup,
			{
				sql: SQL`select "root_"."id" from "public"."category" as "root_" where "root_"."id" = ? and "root_"."visible" = ?`,
				parameters: [testUuid(2), true],
				response: { rows: [{ id: testUuid(2) }] },
			},
			{
				sql:
					SQL`with "newData_" as (select ? :: uuid as "category_id", "root_"."category_id" as "category_id_old__", "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?)
					update "public"."post" set "category_id" = "newData_"."category_id" from "newData_" where "post"."id" = "newData_"."id" returning "category_id_old__"`,
				parameters: [testUuid(2), testUuid(1)],
				response: { rows: [{ category_id_old__: null }] },
			},
		]),
	)
})

test('nested connectOrCreate connects an existing target instead of creating a duplicate', async () => {
	await run(
		GQL`mutation {
			updatePost(by: {id: "${testUuid(1)}"}, data: {category: {connectOrCreate: {connect: {id: "${testUuid(2)}"}, create: {name: "News"}}}}) { ok }
		}`,
		sqlTransaction([
			postLookup,
			{
				sql: SQL`select "root_"."id" from "public"."category" as "root_" where "root_"."id" = ? and "root_"."visible" = ?`,
				parameters: [testUuid(2), true],
				response: { rows: [{ id: testUuid(2) }] },
			},
			{
				sql:
					SQL`with "newData_" as (select ? :: uuid as "category_id", "root_"."category_id" as "category_id_old__", "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?)
					update "public"."post" set "category_id" = "newData_"."category_id" from "newData_" where "post"."id" = "newData_"."id" returning "category_id_old__"`,
				parameters: [testUuid(2), testUuid(1)],
				response: { rows: [{ category_id_old__: null }] },
			},
		]),
	)
})

test('nested m:n disconnect looks the target up in the nested scope', async () => {
	await run(
		GQL`mutation {
			updatePost(by: {id: "${testUuid(1)}"}, data: {tags: [{disconnect: {id: "${testUuid(3)}"}}]}) { ok }
		}`,
		sqlTransaction([
			postLookup,
			{
				sql: SQL`select "root_"."id" from "public"."tag" as "root_" where "root_"."id" = ? and "root_"."hidden" = ?`,
				parameters: [testUuid(3), false],
				response: { rows: [{ id: testUuid(3) }] },
			},
			{
				sql: SQL`delete from "public"."post_tags" where "post_id" = ? and "tag_id" = ?`,
				parameters: [testUuid(1), testUuid(3)],
				response: { rowCount: 1 },
			},
		]),
	)
})

test('nested update by id looks the target up in the nested scope', async () => {
	await run(
		GQL`mutation {
			updatePost(by: {id: "${testUuid(1)}"}, data: {comments: [{update: {by: {id: "${testUuid(4)}"}, data: {text: "Hello"}}}]}) { ok }
		}`,
		sqlTransaction([
			postLookup,
			{
				sql: SQL`select "root_"."id" from "public"."comment" as "root_" where "root_"."id" = ? and "root_"."post_id" = ? and "root_"."approved" = ?`,
				parameters: [testUuid(4), testUuid(1), true],
				response: { rows: [{ id: testUuid(4) }] },
			},
			{
				sql:
					SQL`with "newData_" as (select ? :: text as "text", "root_"."text" as "text_old__", "root_"."id", "root_"."approved", "root_"."post_id" from "public"."comment" as "root_" where "root_"."id" = ? and "root_"."approved" = ?)
					update "public"."comment" set "text" = "newData_"."text" from "newData_" where "comment"."id" = "newData_"."id" and "newData_"."approved" = ? returning "text_old__"`,
				parameters: ['Hello', testUuid(4), true, true],
				response: { rows: [{ text_old__: 'Hi' }] },
			},
		]),
	)
})

test('nested delete by id looks the target up in the nested scope', async () => {
	await run(
		GQL`mutation {
			updatePost(by: {id: "${testUuid(1)}"}, data: {comments: [{delete: {id: "${testUuid(4)}"}}]}) { ok }
		}`,
		sqlTransaction([
			postLookup,
			{
				sql: SQL`select "root_"."id" from "public"."comment" as "root_" where "root_"."id" = ? and "root_"."post_id" = ? and "root_"."approved" = ?`,
				parameters: [testUuid(4), testUuid(1), true],
				response: { rows: [{ id: testUuid(4) }] },
			},
			{
				sql: SQL`select "root_"."id" as "id", "root_"."approved" = ? as "allowed" from "public"."comment" as "root_" where "root_"."id" = ?`,
				parameters: [true, testUuid(4)],
				response: { rows: [{ id: testUuid(4), allowed: true }] },
			},
			{
				sql: SQL`delete from "public"."comment" where "id" in (?)`,
				parameters: [testUuid(4)],
				response: { rowCount: 1 },
			},
		]),
	)
})

test('nested upsert updates an existing target instead of creating a duplicate', async () => {
	await run(
		GQL`mutation {
			updatePost(by: {id: "${testUuid(1)}"}, data: {comments: [{upsert: {by: {id: "${
			testUuid(4)
		}"}, update: {text: "Hello"}, create: {text: "Hello"}}}]}) { ok }
		}`,
		sqlTransaction([
			postLookup,
			{
				sql: SQL`select "root_"."id" from "public"."comment" as "root_" where "root_"."id" = ? and "root_"."post_id" = ? and "root_"."approved" = ?`,
				parameters: [testUuid(4), testUuid(1), true],
				response: { rows: [{ id: testUuid(4) }] },
			},
			{
				sql:
					SQL`with "newData_" as (select ? :: text as "text", "root_"."text" as "text_old__", "root_"."id", "root_"."approved", "root_"."post_id" from "public"."comment" as "root_" where "root_"."id" = ? and "root_"."approved" = ?)
					update "public"."comment" set "text" = "newData_"."text" from "newData_" where "comment"."id" = "newData_"."id" and "newData_"."approved" = ? returning "text_old__"`,
				parameters: ['Hello', testUuid(4), true, true],
				response: { rows: [{ text_old__: 'Hi' }] },
			},
		]),
	)
})

test('two-level has-one update reads the intermediate row in the nested scope', async () => {
	await run(
		GQL`mutation {
			updatePost(by: {id: "${testUuid(1)}"}, data: {category: {update: {badge: {update: {note: "Hello"}}}}}) { ok }
		}`,
		sqlTransaction([
			postLookup,
			{
				sql: SQL`select "root_"."category_id" from "public"."post" as "root_" where "root_"."id" = ?`,
				parameters: [testUuid(1)],
				response: { rows: [{ category_id: testUuid(2) }] },
			},
			{
				sql: SQL`select "root_"."id" from "public"."category" as "root_" where "root_"."visible" = ? and "root_"."id" = ?`,
				parameters: [true, testUuid(2)],
				response: { rows: [{ id: testUuid(2) }] },
			},
			{
				sql: SQL`select "root_"."badge_id" from "public"."category" as "root_" where "root_"."id" = ? and "root_"."visible" = ?`,
				parameters: [testUuid(2), true],
				response: { rows: [{ badge_id: testUuid(5) }] },
			},
			{
				sql:
					SQL`with "newData_" as (select ? :: text as "note", "root_"."note" as "note_old__", "root_"."id", "root_"."locked" from "public"."badge" as "root_" where "root_"."id" = ? and "root_"."locked" = ?)
					update "public"."badge" set "note" = "newData_"."note" from "newData_" where "badge"."id" = "newData_"."id" and "newData_"."locked" = ? returning "note_old__"`,
				parameters: ['Hello', testUuid(5), false, false],
				response: { rows: [{ note_old__: 'Hi' }] },
			},
		]),
	)
})
