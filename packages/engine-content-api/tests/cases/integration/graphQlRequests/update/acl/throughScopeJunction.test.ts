import { test } from 'bun:test'
import { execute, sqlTransaction } from '../../../../../src/test.js'
import { c, createSchema } from '@contember/schema-definition'
import { PermissionFactory } from '../../../../../../src/index.js'
import { GQL, SQL } from '../../../../../src/tags.js'
import { testUuid } from '../../../../../src/testUuid.js'

/**
 * Covers junction writes where the owning entity is reached over a relation: a `through`-only grant
 * is honoured on connect, on disconnect, and on the inverse-side predicate `JunctionTableManager`
 * builds from `relation.inversedBy`.
 *
 * The mirrored root case, where the very same grants have to be denied, lives in
 * `throughScopeRootWrites.test.ts`.
 */
namespace JunctionThrough {
	export const editor = c.createRole('editor')

	@c.Allow(editor, {
		read: ['id'],
		update: ['id', 'content'],
	})
	export class Article {
		content = c.manyHasOne(Content)
	}

	@c.Allow(editor, {
		read: ['id'],
	})
	@c.Allow(editor, {
		through: true,
		when: { published: { eq: true } },
		update: ['categories'],
	})
	export class Content {
		published = c.boolColumn().notNull()
		categories = c.manyHasMany(Category, 'contents')
	}

	@c.Allow(editor, {
		read: ['id'],
	})
	@c.Allow(editor, {
		through: true,
		when: { visible: { eq: true } },
		update: ['contents'],
	})
	export class Category {
		visible = c.boolColumn().notNull()
		contents = c.manyHasManyInverse(Content, 'categories')
	}
}

const junctionSchema = createSchema(JunctionThrough)
const junctionPermissions = new PermissionFactory().createContextual(junctionSchema, ['editor'])

test('nested m:n connect resolves both junction predicates in the nested scope', async () => {
	await execute({
		schema: junctionSchema.model,
		permissions: junctionPermissions.root,
		nestedPermissions: junctionPermissions.all,
		query: GQL`mutation {
        updateArticle(
            by: {id: "${testUuid(1)}"},
            data: {content: {update: {categories: [{connect: {id: "${testUuid(3)}"}}]}}}
          ) {
          ok
        }
      }`,
		executes: [
			...sqlTransaction([
				{
					sql: SQL`select "root_"."id" from "public"."article" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`select "root_"."content_id" from "public"."article" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ content_id: testUuid(2) }] },
				},
				{
					sql: SQL`select "root_"."id" from "public"."category" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(3)],
					response: { rows: [{ id: testUuid(3) }] },
				},
				{
					// `"owning"."published"` and `"inverse"."visible"` both come from through-only grants
					sql: SQL`with "data" as
            (select
               "owning"."id" as "content_id",
               "inverse"."id" as "category_id",
               true as "selected"
             from (values (null)) as "t" inner join "public"."content" as "owning" on true
               inner join "public"."category" as "inverse" on true
             where "owning"."published" = ? and "owning"."id" = ? and "inverse"."visible" = ? and "inverse"."id" = ?),
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
					parameters: [true, testUuid(2), true, testUuid(3)],
					response: { rows: [{ selected: true, inserted: true }] },
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

test('nested m:n disconnect resolves both junction predicates in the nested scope', async () => {
	await execute({
		schema: junctionSchema.model,
		permissions: junctionPermissions.root,
		nestedPermissions: junctionPermissions.all,
		query: GQL`mutation {
        updateArticle(
            by: {id: "${testUuid(1)}"},
            data: {content: {update: {categories: [{disconnect: {id: "${testUuid(3)}"}}]}}}
          ) {
          ok
        }
      }`,
		executes: [
			...sqlTransaction([
				{
					sql: SQL`select "root_"."id" from "public"."article" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`select "root_"."content_id" from "public"."article" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ content_id: testUuid(2) }] },
				},
				{
					sql: SQL`select "root_"."id" from "public"."category" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(3)],
					response: { rows: [{ id: testUuid(3) }] },
				},
				{
					// same pair of through-only predicates guards the junction delete
					sql: SQL`with "data" as
            (select
               "owning"."id" as "content_id",
               "inverse"."id" as "category_id",
               true as "selected"
             from (values (null)) as "t" inner join "public"."content" as "owning" on true
               inner join "public"."category" as "inverse" on true
             where "owning"."published" = ? and "owning"."id" = ? and "inverse"."visible" = ? and "inverse"."id" = ?),
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
					parameters: [true, testUuid(2), true, testUuid(3)],
					response: { rows: [{ selected: true, deleted: true }] },
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

/**
 * Here only the inverse side is through-only, so the junction SQL isolates the second predicate
 * `JunctionTableManager` builds from `relation.inversedBy`.
 */
namespace JunctionInverseThrough {
	export const editor = c.createRole('editor')

	@c.Allow(editor, {
		read: ['id'],
		update: ['id', 'page'],
	})
	export class Site {
		page = c.manyHasOne(Page)
	}

	@c.Allow(editor, {
		read: ['id'],
		update: ['id', 'tags'],
	})
	export class Page {
		tags = c.manyHasMany(Tag, 'pages')
	}

	@c.Allow(editor, {
		read: ['id'],
	})
	@c.Allow(editor, {
		through: true,
		when: { approved: { eq: true } },
		update: ['pages'],
	})
	export class Tag {
		approved = c.boolColumn().notNull()
		pages = c.manyHasManyInverse(Page, 'tags')
	}
}

const inverseSchema = createSchema(JunctionInverseThrough)
const inversePermissions = new PermissionFactory().createContextual(inverseSchema, ['editor'])

test('the inverse side of a junction write uses the inverse entity through grant', async () => {
	await execute({
		schema: inverseSchema.model,
		permissions: inversePermissions.root,
		nestedPermissions: inversePermissions.all,
		query: GQL`mutation {
        updateSite(
            by: {id: "${testUuid(1)}"},
            data: {page: {update: {tags: [{connect: {id: "${testUuid(3)}"}}]}}}
          ) {
          ok
        }
      }`,
		executes: [
			...sqlTransaction([
				{
					sql: SQL`select "root_"."id" from "public"."site" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`select "root_"."page_id" from "public"."site" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ page_id: testUuid(2) }] },
				},
				{
					sql: SQL`select "root_"."id" from "public"."tag" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(3)],
					response: { rows: [{ id: testUuid(3) }] },
				},
				{
					// the owning side contributes no predicate, so `"inverse"."approved"` is the only ACL condition
					sql: SQL`with "data" as
            (select
               "owning"."id" as "page_id",
               "inverse"."id" as "tag_id",
               true as "selected"
             from (values (null)) as "t" inner join "public"."page" as "owning" on true
               inner join "public"."tag" as "inverse" on true
             where "owning"."id" = ? and "inverse"."approved" = ? and "inverse"."id" = ?),
                "insert" as
              (insert into "public"."page_tags" ("page_id", "tag_id")
                select
                  "data"."page_id",
                  "data"."tag_id"
                from "data"
              on conflict do nothing
              returning true as inserted)
            select
              coalesce(data.selected, false) as "selected",
              coalesce(insert.inserted, false) as "inserted"
            from (values (null)) as "t" left join "data" as "data" on true
              left join "insert" as "insert" on true`,
					parameters: [testUuid(2), true, testUuid(3)],
					response: { rows: [{ selected: true, inserted: true }] },
				},
			]),
		],
		return: {
			data: {
				updateSite: {
					ok: true,
				},
			},
		},
	})
})
