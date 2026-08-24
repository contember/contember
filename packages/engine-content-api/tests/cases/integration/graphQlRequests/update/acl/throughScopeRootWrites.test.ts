import { test } from 'bun:test'
import { execute, failedTransaction, sqlTransaction } from '../../../../../src/test.js'
import { c, createSchema } from '@contember/schema-definition'
import { PermissionFactory } from '../../../../../../src/index.js'
import { GQL, SQL } from '../../../../../src/tags.js'
import { testUuid } from '../../../../../src/testUuid.js'

/**
 * The mirror of the nested junction and relation tests: the same grants, reached at the mutation
 * root, have to be denied. Every pair below shares one fixture, so the only thing that differs
 * between the denied case and its control is where the entity sits.
 */
namespace RootThrough {
	export const editor = c.createRole('editor')

	@c.Allow(editor, {
		read: ['id'],
		update: ['id', 'content', 'post'],
	})
	export class Article {
		content = c.manyHasOne(Content)
		post = c.manyHasOne(Post)
	}

	@c.Allow(editor, {
		read: ['id', 'title'],
		update: ['title'],
	})
	@c.Allow(editor, {
		through: true,
		update: ['categories'],
	})
	export class Content {
		title = c.stringColumn()
		categories = c.manyHasMany(Category, 'contents')
	}

	@c.Allow(editor, {
		read: ['id'],
		update: ['contents'],
	})
	export class Category {
		contents = c.manyHasManyInverse(Content, 'categories')
	}

	@c.Allow(editor, {
		read: ['id', 'title'],
		update: ['title'],
	})
	@c.Allow(editor, {
		through: true,
		update: ['locales'],
	})
	export class Post {
		title = c.stringColumn()
		locales = c.oneHasMany(PostLocale, 'post')
	}

	@c.Allow(editor, {
		read: ['id', 'title', 'post'],
		update: ['title', 'post'],
	})
	export class PostLocale {
		title = c.stringColumn()
		post = c.manyHasOne(Post, 'locales')
	}
}

const schema = createSchema(RootThrough)
const permissions = new PermissionFactory().createContextual(schema, ['editor'])

const contentId = testUuid(1)
const categoryId = testUuid(2)
const postId = testUuid(3)
const localeId = testUuid(4)
const articleId = testUuid(10)

test('root m:n connect is denied when the owning grant is through-only', async () => {
	await execute({
		schema: schema.model,
		permissions: permissions.root,
		nestedPermissions: permissions.all,
		query: GQL`mutation {
        updateContent(
            by: {id: "${contentId}"},
            data: {categories: [{connect: {id: "${categoryId}"}}]}
          ) {
          ok
        }
      }`,
		executes: [
			...failedTransaction([
				{
					sql: SQL`select "root_"."id" from "public"."content" as "root_" where "root_"."id" = ?`,
					parameters: [contentId],
					response: { rows: [{ id: contentId }] },
				},
				{
					sql: SQL`select "root_"."id" from "public"."category" as "root_" where "root_"."id" = ?`,
					parameters: [categoryId],
					response: { rows: [{ id: categoryId }] },
				},
				{
					// `false` is the owning predicate resolved at the root: the only grant for `categories` is through-only
					sql: SQL`with "data" as
            (select
               "owning"."id" as "content_id",
               "inverse"."id" as "category_id",
               true as "selected"
             from (values (null)) as "t" inner join "public"."content" as "owning" on true
               inner join "public"."category" as "inverse" on true
             where false and "inverse"."id" = ?),
                "insert" as
              (insert into "public"."content_categories" ("content_id", "category_id")
                select
                  "data"."content_id",
                  "data"."category_id"
                from "data"
              on conflict do nothing
              returning true as inserted)
            select
              coalesce(data.selected, false) as "selected",
              coalesce(insert.inserted, false) as "inserted"
            from (values (null)) as "t" left join "data" as "data" on true
              left join "insert" as "insert" on true`,
					parameters: [categoryId],
					response: { rows: [{ selected: false, inserted: false }] },
				},
			]),
		],
		return: {
			data: {
				updateContent: {
					ok: false,
				},
			},
		},
	})
})

test('the same m:n connect reached over a relation is allowed', async () => {
	await execute({
		schema: schema.model,
		permissions: permissions.root,
		nestedPermissions: permissions.all,
		query: GQL`mutation {
        updateArticle(
            by: {id: "${articleId}"},
            data: {content: {update: {categories: [{connect: {id: "${categoryId}"}}]}}}
          ) {
          ok
        }
      }`,
		executes: [
			...sqlTransaction([
				{
					sql: SQL`select "root_"."id" from "public"."article" as "root_" where "root_"."id" = ?`,
					parameters: [articleId],
					response: { rows: [{ id: articleId }] },
				},
				{
					sql: SQL`select "root_"."content_id" from "public"."article" as "root_" where "root_"."id" = ?`,
					parameters: [articleId],
					response: { rows: [{ content_id: contentId }] },
				},
				{
					sql: SQL`select "root_"."id" from "public"."category" as "root_" where "root_"."id" = ?`,
					parameters: [categoryId],
					response: { rows: [{ id: categoryId }] },
				},
				{
					// nested, so the through grant applies: both sides carry no predicate and the plain insert is used
					sql: SQL`insert into "public"."content_categories" ("content_id", "category_id")
              values (?, ?)
              on conflict do nothing`,
					parameters: [contentId, categoryId],
					response: { rowCount: 1 },
				},
			]),
		],
		return: {
			data: {
				updateArticle: {
					ok: true,
				},
			},
		},
	})
})

test('root m:n disconnect is denied when the owning grant is through-only', async () => {
	await execute({
		schema: schema.model,
		permissions: permissions.root,
		nestedPermissions: permissions.all,
		query: GQL`mutation {
        updateContent(
            by: {id: "${contentId}"},
            data: {categories: [{disconnect: {id: "${categoryId}"}}]}
          ) {
          ok
        }
      }`,
		executes: [
			...failedTransaction([
				{
					sql: SQL`select "root_"."id" from "public"."content" as "root_" where "root_"."id" = ?`,
					parameters: [contentId],
					response: { rows: [{ id: contentId }] },
				},
				{
					sql: SQL`select "root_"."id" from "public"."category" as "root_" where "root_"."id" = ?`,
					parameters: [categoryId],
					response: { rows: [{ id: categoryId }] },
				},
				{
					// same owning predicate, so the junction delete is guarded by `false` instead of running unconditionally
					sql: SQL`with "data" as
            (select
               "owning"."id" as "content_id",
               "inverse"."id" as "category_id",
               true as "selected"
             from (values (null)) as "t" inner join "public"."content" as "owning" on true
               inner join "public"."category" as "inverse" on true
             where false and "inverse"."id" = ?),
                "delete" as
              (delete from "public"."content_categories"
              using "data" as "data"
              where "content_categories"."content_id" = "data"."content_id" and "content_categories"."category_id" = "data"."category_id"
              returning true as deleted)
            select
              coalesce(data.selected, false) as "selected",
              coalesce(delete.deleted, false) as "deleted"
            from (values (null)) as "t" left join "data" as "data" on true
              left join "delete" as "delete" on true`,
					parameters: [categoryId],
					response: { rows: [{ selected: false, deleted: false }] },
				},
			]),
		],
		return: {
			data: {
				updateContent: {
					ok: false,
				},
			},
		},
	})
})

test('the same m:n disconnect reached over a relation is allowed', async () => {
	await execute({
		schema: schema.model,
		permissions: permissions.root,
		nestedPermissions: permissions.all,
		query: GQL`mutation {
        updateArticle(
            by: {id: "${articleId}"},
            data: {content: {update: {categories: [{disconnect: {id: "${categoryId}"}}]}}}
          ) {
          ok
        }
      }`,
		executes: [
			...sqlTransaction([
				{
					sql: SQL`select "root_"."id" from "public"."article" as "root_" where "root_"."id" = ?`,
					parameters: [articleId],
					response: { rows: [{ id: articleId }] },
				},
				{
					sql: SQL`select "root_"."content_id" from "public"."article" as "root_" where "root_"."id" = ?`,
					parameters: [articleId],
					response: { rows: [{ content_id: contentId }] },
				},
				{
					sql: SQL`select "root_"."id" from "public"."category" as "root_" where "root_"."id" = ?`,
					parameters: [categoryId],
					response: { rows: [{ id: categoryId }] },
				},
				{
					// nested again: no predicate on either side, so the plain delete is used
					sql: SQL`delete from "public"."content_categories"
              where "content_id" = ? and "category_id" = ?`,
					parameters: [contentId, categoryId],
					response: { rowCount: 1 },
				},
			]),
		],
		return: {
			data: {
				updateArticle: {
					ok: true,
				},
			},
		},
	})
})

test('root 1:N nested update is denied when the relation grant is through-only', async () => {
	await execute({
		schema: schema.model,
		permissions: permissions.root,
		nestedPermissions: permissions.all,
		query: GQL`mutation {
        updatePost(
            by: {id: "${postId}"},
            data: {locales: [{update: {by: {id: "${localeId}"}, data: {title: "Hello"}}}]}
          ) {
          ok
        }
      }`,
		executes: [
			...failedTransaction([
				{
					sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?`,
					parameters: [postId],
					response: { rows: [{ id: postId }] },
				},
				{
					// nothing else checks `locales` at the root, so the update predicate is verified on its own - and it is `false`
					sql: SQL`select "root_"."id" from "public"."post" as "root_" where false`,
					parameters: [],
					response: { rows: [] },
				},
			]),
		],
		return: {
			data: {
				updatePost: {
					ok: false,
				},
			},
		},
	})
})

test('the same 1:N nested update reached over a relation is allowed', async () => {
	await execute({
		schema: schema.model,
		permissions: permissions.root,
		nestedPermissions: permissions.all,
		query: GQL`mutation {
        updateArticle(
            by: {id: "${articleId}"},
            data: {post: {update: {locales: [{update: {by: {id: "${localeId}"}, data: {title: "Hello"}}}]}}}
          ) {
          ok
        }
      }`,
		executes: [
			...sqlTransaction([
				{
					sql: SQL`select "root_"."id" from "public"."article" as "root_" where "root_"."id" = ?`,
					parameters: [articleId],
					response: { rows: [{ id: articleId }] },
				},
				{
					sql: SQL`select "root_"."post_id" from "public"."article" as "root_" where "root_"."id" = ?`,
					parameters: [articleId],
					response: { rows: [{ post_id: postId }] },
				},
				{
					// no `false` anywhere: nested, so the through grant covers `locales` and the locale update goes ahead
					sql: SQL`select "root_"."id" from "public"."post_locale" as "root_" where "root_"."id" = ? and "root_"."post_id" = ?`,
					parameters: [localeId, postId],
					response: { rows: [{ id: localeId }] },
				},
				{
					sql: SQL`with "newData_" as
            (select ? :: text as "title", "root_"."title" as "title_old__", "root_"."id", "root_"."post_id"
             from "public"."post_locale" as "root_"
             where "root_"."id" = ?)
            update "public"."post_locale"
            set "title" = "newData_"."title"
            from "newData_"
            where "post_locale"."id" = "newData_"."id"
            returning "title_old__"`,
					parameters: ['Hello', localeId],
					response: { rows: [{ title_old__: 'Old' }] },
				},
			]),
		],
		return: {
			data: {
				updateArticle: {
					ok: true,
				},
			},
		},
	})
})

test('an ordinary root update with column data pays no extra query', async () => {
	await execute({
		schema: schema.model,
		permissions: permissions.root,
		nestedPermissions: permissions.all,
		query: GQL`mutation {
        updateContent(
            by: {id: "${contentId}"},
            data: {title: "Hello"}
          ) {
          ok
        }
      }`,
		executes: [
			...sqlTransaction([
				{
					sql: SQL`select "root_"."id" from "public"."content" as "root_" where "root_"."id" = ?`,
					parameters: [contentId],
					response: { rows: [{ id: contentId }] },
				},
				{
					sql: SQL`with "newData_" as
            (select ? :: text as "title", "root_"."title" as "title_old__", "root_"."id"
             from "public"."content" as "root_"
             where "root_"."id" = ?)
            update "public"."content"
            set "title" = "newData_"."title"
            from "newData_"
            where "content"."id" = "newData_"."id"
            returning "title_old__"`,
					parameters: ['Hello', contentId],
					response: { rows: [{ title_old__: 'Old' }] },
				},
			]),
		],
		return: {
			data: {
				updateContent: {
					ok: true,
				},
			},
		},
	})
})
