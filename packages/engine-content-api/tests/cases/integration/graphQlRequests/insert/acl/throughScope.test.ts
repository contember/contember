import { test } from 'bun:test'
import { execute, failedTransaction, sqlTransaction } from '../../../../../src/test.js'
import { c, createSchema } from '@contember/schema-definition'
import { PermissionFactory } from '../../../../../../src/index.js'
import { GQL, SQL } from '../../../../../src/tags.js'
import { testUuid } from '../../../../../src/testUuid.js'

/**
 * Every create relation processor resolves its target against the nested permission set, so a
 * `through` create grant applies under a relation and nowhere else. Each positive case gives the
 * through grant a `when` predicate: the predicate lives only in the `through` bucket, so seeing it
 * in the insert's where clause is what proves the nested set was used.
 */

namespace ManyHasOneThrough {
	export const editorRole = c.createRole('editor')

	@c.Allow(editorRole, { read: true, create: true })
	export class Post {
		title = c.stringColumn()
		author = c.manyHasOne(Author)
	}

	@c.Allow(editorRole, { through: true, when: { name: { eq: 'John' } }, create: ['name'] })
	export class Author {
		name = c.stringColumn()
	}
}

test('many has one: nested create resolves against the through grant', async () => {
	const schema = createSchema(ManyHasOneThrough)
	const { root, all } = new PermissionFactory().createContextual(schema, ['editor'])

	await execute({
		schema: schema.model,
		permissions: root,
		nestedPermissions: all,
		query: GQL`mutation {
        createPost(data: {title: "Hello", author: {create: {name: "John"}}}) {
          ok
        }
      }`,
		executes: [
			...sqlTransaction([
				{
					sql: SQL`with "root_" as (select ? :: uuid as "id", ? :: text as "name")
						insert into "public"."author" ("id", "name")
						select "root_"."id", "root_"."name" from "root_" where "root_"."name" = ? returning "id"`,
					parameters: [testUuid(2), 'John', 'John'],
					response: { rows: [{ id: testUuid(2) }] },
				},
				{
					sql: SQL`with "root_" as (select ? :: uuid as "id", ? :: text as "title", ? :: uuid as "author_id")
						insert into "public"."post" ("id", "title", "author_id")
						select "root_"."id", "root_"."title", "root_"."author_id" from "root_" returning "id"`,
					parameters: [testUuid(1), 'Hello', testUuid(2)],
					response: { rows: [{ id: testUuid(1) }] },
				},
			]),
		],
		return: {
			data: {
				createPost: {
					ok: true,
				},
			},
		},
	})
})

test('a through-only create grant does not open a root mutation', async () => {
	const schema = createSchema(ManyHasOneThrough)
	const { root, all } = new PermissionFactory().createContextual(schema, ['editor'])

	await execute({
		schema: schema.model,
		permissions: root,
		nestedPermissions: all,
		query: GQL`mutation {
        createAuthor(data: {name: "John"}) {
          ok
        }
      }`,
		executes: [],
		return: {
			errors: [{ message: 'Cannot query field "createAuthor" on type "Mutation".' }],
		},
	})
})

namespace OneHasManyThrough {
	export const editorRole = c.createRole('editor')

	@c.Allow(editorRole, { read: true, create: true })
	export class Post {
		title = c.stringColumn()
		locales = c.oneHasMany(PostLocale, 'post')
	}

	@c.Allow(editorRole, { through: true, when: { title: { eq: 'Ahoj svete' } }, create: ['title', 'post'] })
	export class PostLocale {
		title = c.stringColumn()
		post = c.manyHasOne(Post, 'locales')
	}
}

test('one has many: nested create resolves against the through grant', async () => {
	const schema = createSchema(OneHasManyThrough)
	const { root, all } = new PermissionFactory().createContextual(schema, ['editor'])

	await execute({
		schema: schema.model,
		permissions: root,
		nestedPermissions: all,
		query: GQL`mutation {
        createPost(data: {title: "Hello", locales: [{create: {title: "Ahoj svete"}}]}) {
          ok
        }
      }`,
		executes: [
			...sqlTransaction([
				{
					sql: SQL`with "root_" as (select ? :: uuid as "id", ? :: text as "title")
						insert into "public"."post" ("id", "title")
						select "root_"."id", "root_"."title" from "root_" returning "id"`,
					parameters: [testUuid(1), 'Hello'],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`with "root_" as (select ? :: uuid as "id", ? :: text as "title", ? :: uuid as "post_id")
						insert into "public"."post_locale" ("id", "title", "post_id")
						select "root_"."id", "root_"."title", "root_"."post_id" from "root_" where "root_"."title" = ? returning "id"`,
					parameters: [testUuid(2), 'Ahoj svete', testUuid(1), 'Ahoj svete'],
					response: { rows: [{ id: testUuid(2) }] },
				},
			]),
		],
		return: {
			data: {
				createPost: {
					ok: true,
				},
			},
		},
	})
})

namespace ManyHasManyThrough {
	export const editorRole = c.createRole('editor')

	@c.Allow(editorRole, { read: true, create: true, update: true })
	export class Post {
		title = c.stringColumn()
		categories = c.manyHasMany(Category)
	}

	@c.Allow(editorRole, { through: true, when: { name: { eq: 'News' } }, create: ['name'] })
	export class Category {
		name = c.stringColumn()
	}
}

test('many has many: nested create resolves against the through grant', async () => {
	const schema = createSchema(ManyHasManyThrough)
	const { root, all } = new PermissionFactory().createContextual(schema, ['editor'])

	await execute({
		schema: schema.model,
		permissions: root,
		nestedPermissions: all,
		query: GQL`mutation {
        createPost(data: {title: "Hello", categories: [{create: {name: "News"}}]}) {
          ok
        }
      }`,
		executes: [
			...sqlTransaction([
				{
					sql: SQL`with "root_" as (select ? :: uuid as "id", ? :: text as "title")
						insert into "public"."post" ("id", "title")
						select "root_"."id", "root_"."title" from "root_" returning "id"`,
					parameters: [testUuid(1), 'Hello'],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`with "root_" as (select ? :: uuid as "id", ? :: text as "name")
						insert into "public"."category" ("id", "name")
						select "root_"."id", "root_"."name" from "root_" where "root_"."name" = ? returning "id"`,
					parameters: [testUuid(2), 'News', 'News'],
					response: { rows: [{ id: testUuid(2) }] },
				},
				{
					sql: SQL`insert into "public"."post_categories" ("post_id", "category_id") values (?, ?) on conflict do nothing`,
					parameters: [testUuid(1), testUuid(2)],
					response: 1,
				},
			]),
		],
		return: {
			data: {
				createPost: {
					ok: true,
				},
			},
		},
	})
})

namespace OneHasOneOwningThrough {
	export const editorRole = c.createRole('editor')

	@c.Allow(editorRole, { read: true, create: true })
	export class Site {
		name = c.stringColumn()
		setting = c.oneHasOne(SiteSetting)
	}

	@c.Allow(editorRole, { through: true, when: { url: { eq: 'https://example.com' } }, create: ['url'] })
	export class SiteSetting {
		url = c.stringColumn()
	}
}

test('one has one owning: nested create resolves against the through grant', async () => {
	const schema = createSchema(OneHasOneOwningThrough)
	const { root, all } = new PermissionFactory().createContextual(schema, ['editor'])

	await execute({
		schema: schema.model,
		permissions: root,
		nestedPermissions: all,
		query: GQL`mutation {
        createSite(data: {name: "Example", setting: {create: {url: "https://example.com"}}}) {
          ok
        }
      }`,
		executes: [
			...sqlTransaction([
				{
					sql: SQL`with "root_" as (select ? :: uuid as "id", ? :: text as "url")
						insert into "public"."site_setting" ("id", "url")
						select "root_"."id", "root_"."url" from "root_" where "root_"."url" = ? returning "id"`,
					parameters: [testUuid(2), 'https://example.com', 'https://example.com'],
					response: { rows: [{ id: testUuid(2) }] },
				},
				{
					sql: SQL`with "root_" as (select ? :: uuid as "id", ? :: text as "name", ? :: uuid as "setting_id")
						insert into "public"."site" ("id", "name", "setting_id")
						select "root_"."id", "root_"."name", "root_"."setting_id" from "root_" returning "id"`,
					parameters: [testUuid(1), 'Example', testUuid(2)],
					response: { rows: [{ id: testUuid(1) }] },
				},
			]),
		],
		return: {
			data: {
				createSite: {
					ok: true,
				},
			},
		},
	})
})

namespace OneHasOneInverseThrough {
	export const editorRole = c.createRole('editor')

	@c.Allow(editorRole, { read: true, create: true })
	export class SiteSetting {
		url = c.stringColumn()
		site = c.oneHasOneInverse(Site, 'setting')
	}

	@c.Allow(editorRole, { through: true, create: ['setting'] })
	@c.Allow(editorRole, { through: true, when: { name: { eq: 'Example' } }, create: ['name'] })
	export class Site {
		name = c.stringColumn()
		setting = c.oneHasOne(SiteSetting, 'site')
	}
}

test('one has one inverse: nested create resolves against the through grant', async () => {
	const schema = createSchema(OneHasOneInverseThrough)
	const { root, all } = new PermissionFactory().createContextual(schema, ['editor'])

	await execute({
		schema: schema.model,
		permissions: root,
		nestedPermissions: all,
		query: GQL`mutation {
        createSiteSetting(data: {url: "https://example.com", site: {create: {name: "Example"}}}) {
          ok
        }
      }`,
		executes: [
			...sqlTransaction([
				{
					sql: SQL`with "root_" as (select ? :: uuid as "id", ? :: text as "url")
						insert into "public"."site_setting" ("id", "url")
						select "root_"."id", "root_"."url" from "root_" returning "id"`,
					parameters: [testUuid(1), 'https://example.com'],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`with "root_" as (select ? :: uuid as "id", ? :: text as "name", ? :: uuid as "setting_id")
						insert into "public"."site" ("id", "name", "setting_id")
						select "root_"."id", "root_"."name", "root_"."setting_id" from "root_" where "root_"."name" = ? returning "id"`,
					parameters: [testUuid(2), 'Example', testUuid(1), 'Example'],
					response: { rows: [{ id: testUuid(2) }] },
				},
			]),
		],
		return: {
			data: {
				createSiteSetting: {
					ok: true,
				},
			},
		},
	})
})

/**
 * `Author` is creatable at the root, but `secret` is granted only through a relation. The field
 * still appears on the shared create input type, so both mutations parse - only execution differs.
 */
namespace RootCreateWithThroughField {
	export const editorRole = c.createRole('editor')

	@c.Allow(editorRole, { read: true, create: true })
	export class Post {
		title = c.stringColumn()
		author = c.manyHasOne(Author)
	}

	@c.Allow(editorRole, { read: true, create: ['name'] })
	@c.Allow(editorRole, { through: true, when: { secret: { eq: 'classified' } }, create: ['secret'] })
	export class Author {
		name = c.stringColumn()
		secret = c.stringColumn()
	}
}

test('a through-only field is denied when the entity is created at the root', async () => {
	const schema = createSchema(RootCreateWithThroughField)
	const { root, all } = new PermissionFactory().createContextual(schema, ['editor'])

	await execute({
		schema: schema.model,
		permissions: root,
		nestedPermissions: all,
		query: GQL`mutation {
        createAuthor(data: {name: "John", secret: "classified"}) {
          ok
          errors {
            type
          }
        }
      }`,
		executes: [
			...failedTransaction([
				{
					sql: SQL`with "root_" as (select ? :: uuid as "id", ? :: text as "name", ? :: text as "secret")
						insert into "public"."author" ("id", "name", "secret")
						select "root_"."id", "root_"."name", "root_"."secret" from "root_" where false returning "id"`,
					parameters: [testUuid(1), 'John', 'classified'],
					response: { rows: [] },
				},
			]),
		],
		return: {
			data: {
				createAuthor: {
					ok: false,
					errors: [{ type: 'NotFoundOrDenied' }],
				},
			},
		},
	})
})

test('the same through-only field is writable when the entity is created through a relation', async () => {
	const schema = createSchema(RootCreateWithThroughField)
	const { root, all } = new PermissionFactory().createContextual(schema, ['editor'])

	await execute({
		schema: schema.model,
		permissions: root,
		nestedPermissions: all,
		query: GQL`mutation {
        createPost(data: {title: "Hello", author: {create: {name: "John", secret: "classified"}}}) {
          ok
        }
      }`,
		executes: [
			...sqlTransaction([
				{
					sql: SQL`with "root_" as (select ? :: uuid as "id", ? :: text as "name", ? :: text as "secret")
						insert into "public"."author" ("id", "name", "secret")
						select "root_"."id", "root_"."name", "root_"."secret" from "root_" where "root_"."secret" = ? returning "id"`,
					parameters: [testUuid(2), 'John', 'classified', 'classified'],
					response: { rows: [{ id: testUuid(2) }] },
				},
				{
					sql: SQL`with "root_" as (select ? :: uuid as "id", ? :: text as "title", ? :: uuid as "author_id")
						insert into "public"."post" ("id", "title", "author_id")
						select "root_"."id", "root_"."title", "root_"."author_id" from "root_" returning "id"`,
					parameters: [testUuid(1), 'Hello', testUuid(2)],
					response: { rows: [{ id: testUuid(1) }] },
				},
			]),
		],
		return: {
			data: {
				createPost: {
					ok: true,
				},
			},
		},
	})
})

/**
 * `JunctionTableManager` resolves the owning side's `update` grant for the relation field even when
 * the row is being created, so the create path needs the same root/nested distinction as the update
 * path. `Content.categories` is granted only through a relation.
 */
namespace RootCreateWithThroughJunction {
	export const editorRole = c.createRole('editor')

	@c.Allow(editorRole, { read: ['id', 'contents'], create: ['contents'], update: ['contents'] })
	export class Page {
		contents: c.OneHasManyDefinition = c.oneHasMany(Content, 'page')
	}

	// `create` on the relation field is granted at the root, so the insert itself passes and the
	// denial can only come from the junction write, which resolves the `update` grant.
	@c.Allow(editorRole, { read: ['id', 'title'], create: ['title', 'page', 'categories'], update: ['title'] })
	@c.Allow(editorRole, { through: true, update: ['categories'] })
	export class Content {
		title = c.stringColumn()
		page = c.manyHasOne(Page, 'contents')
		categories = c.manyHasMany(Category, 'contents')
	}

	@c.Allow(editorRole, { read: ['id'], update: ['contents'] })
	export class Category {
		contents: c.ManyHasManyInverse<Content> = c.manyHasManyInverse(Content, 'categories')
	}
}

test('a root create denies a junction write granted only through a relation', async () => {
	const schema = createSchema(RootCreateWithThroughJunction)
	const { root, all } = new PermissionFactory().createContextual(schema, ['editor'])

	await execute({
		schema: schema.model,
		permissions: root,
		nestedPermissions: all,
		query: GQL`mutation {
        createContent(data: {title: "Hello", categories: [{connect: {id: "${testUuid(3)}"}}]}) {
          ok
        }
      }`,
		executes: [
			...failedTransaction([
				{
					sql: SQL`with "root_" as (select ? :: uuid as "id", ? :: text as "title", ? :: uuid as "page_id")
						insert into "public"."content" ("id", "title", "page_id")
						select "root_"."id", "root_"."title", "root_"."page_id" from "root_" returning "id"`,
					parameters: [testUuid(1), 'Hello', null],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`select "root_"."id" from "public"."category" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(3)],
					response: { rows: [{ id: testUuid(3) }] },
				},
				{
					sql: SQL`with "data" as (select "owning"."id" as "content_id", "inverse"."id" as "category_id", true as "selected"
							from (values (null)) as "t"
							inner join "public"."content" as "owning" on true
							inner join "public"."category" as "inverse" on true
							where false and "inverse"."id" = ?),
						"insert" as (insert into "public"."content_categories" ("content_id", "category_id")
							select "data"."content_id", "data"."category_id" from "data" on conflict do nothing returning true as inserted)
						select coalesce(data.selected, false) as "selected", coalesce(insert.inserted, false) as "inserted"
						from (values (null)) as "t" left join "data" as "data" on true left join "insert" as "insert" on true`,
					parameters: [testUuid(3)],
					response: { rows: [{ selected: false, inserted: false }] },
				},
			]),
		],
		return: {
			data: {
				createContent: {
					ok: false,
				},
			},
		},
	})
})
