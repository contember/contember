import { test } from 'bun:test'
import { execute, failedTransaction, sqlTransaction } from '../../../../../src/test.js'
import { c, createSchema } from '@contember/schema-definition'
import { PermissionFactory } from '../../../../../../src/index.js'
import { GQL, SQL } from '../../../../../src/tags.js'
import { testUuid } from '../../../../../src/testUuid.js'

/**
 * `PostLocale` may be updated only through `Post.locales`, and only where the locale is `cs`. The
 * predicate is what makes the SQL below distinguishable from a root grant.
 */
namespace ThroughOneHasMany {
	export const editor = c.createRole('editor')

	@c.Allow(editor, { read: ['id'], update: ['id', 'locales'] })
	export class Post {
		locales = c.oneHasMany(PostLocale, 'post')
	}

	@c.Allow(editor, { read: ['id', 'post'] })
	@c.Allow(editor, { through: true, when: { locale: { eq: 'cs' } }, update: ['title', 'post'] })
	export class PostLocale {
		title = c.stringColumn()
		locale = c.stringColumn()
		post = c.manyHasOne(Post, 'locales').notNull()
	}
}

test('oneHasMany update uses the through grant', async () => {
	const schema = createSchema(ThroughOneHasMany)
	const { root, all } = new PermissionFactory().createContextual(schema, ['editor'])

	await execute({
		schema: schema.model,
		permissions: root,
		nestedPermissions: all,
		query: GQL`mutation {
        updatePost(
            by: {id: "${testUuid(1)}"},
            data: {locales: [{update: {by: {id: "${testUuid(2)}"}, data: {title: "Hello"}}}]}
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
					sql: SQL`select "root_"."id" from "public"."post_locale" as "root_" where "root_"."id" = ? and "root_"."post_id" = ?`,
					parameters: [testUuid(2), testUuid(1)],
					response: { rows: [{ id: testUuid(2) }] },
				},
				{
					sql:
						SQL`with "newData_" as (select ? :: text as "title", "root_"."title" as "title_old__", "root_"."id", "root_"."locale", "root_"."post_id"  from "public"."post_locale" as "root_"  where "root_"."id" = ? and "root_"."locale" = ?)
						update  "public"."post_locale" set  "title" =  "newData_"."title"   from "newData_"  where "post_locale"."id" = "newData_"."id" and "newData_"."locale" = ?  returning "title_old__"`,
					parameters: ['Hello', testUuid(2), 'cs', 'cs'],
					response: { rows: [{ title_old__: 'Hi' }] },
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

namespace ThroughOneHasOneOwning {
	export const editor = c.createRole('editor')

	@c.Allow(editor, { read: ['id'], update: ['id', 'image'] })
	export class Article {
		image = c.oneHasOne(Image)
	}

	@c.Allow(editor, { read: ['id'] })
	@c.Allow(editor, { through: true, when: { published: { eq: true } }, update: ['url'] })
	export class Image {
		url = c.stringColumn()
		published = c.boolColumn()
	}
}

test('oneHasOne owning update uses the through grant', async () => {
	const schema = createSchema(ThroughOneHasOneOwning)
	const { root, all } = new PermissionFactory().createContextual(schema, ['editor'])

	await execute({
		schema: schema.model,
		permissions: root,
		nestedPermissions: all,
		query: GQL`mutation {
        updateArticle(
            by: {id: "${testUuid(1)}"},
            data: {image: {update: {url: "https://example.com/a.png"}}}
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
					sql: SQL`select "root_"."image_id" from "public"."article" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ image_id: testUuid(2) }] },
				},
				{
					sql:
						SQL`with "newData_" as (select ? :: text as "url", "root_"."url" as "url_old__", "root_"."id", "root_"."published"  from "public"."image" as "root_"  where "root_"."id" = ? and "root_"."published" = ?)
						update  "public"."image" set  "url" =  "newData_"."url"   from "newData_"  where "image"."id" = "newData_"."id" and "newData_"."published" = ?  returning "url_old__"`,
					parameters: ['https://example.com/a.png', testUuid(2), true, true],
					response: { rows: [{ url_old__: 'https://example.com/old.png' }] },
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

namespace ThroughOneHasOneInverse {
	export const editor = c.createRole('editor')

	@c.Allow(editor, { read: ['id'], update: ['id', 'contact'] })
	export class Person {
		contact = c.oneHasOneInverse(Contact, 'person')
	}

	@c.Allow(editor, { read: ['id', 'person'] })
	@c.Allow(editor, { through: true, when: { verified: { eq: true } }, update: ['email', 'person'] })
	export class Contact {
		email = c.stringColumn()
		verified = c.boolColumn()
		person = c.oneHasOne(Person, 'contact')
	}
}

test('oneHasOne inverse update uses the through grant', async () => {
	const schema = createSchema(ThroughOneHasOneInverse)
	const { root, all } = new PermissionFactory().createContextual(schema, ['editor'])

	await execute({
		schema: schema.model,
		permissions: root,
		nestedPermissions: all,
		query: GQL`mutation {
        updatePerson(
            by: {id: "${testUuid(1)}"},
            data: {contact: {update: {email: "john@example.com"}}}
          ) {
          ok
        }
      }`,
		executes: [
			...sqlTransaction([
				{
					sql: SQL`select "root_"."id" from "public"."person" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`select "root_"."id" from "public"."contact" as "root_" where "root_"."person_id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(2) }] },
				},
				{
					sql:
						SQL`with "newData_" as (select ? :: text as "email", "root_"."email" as "email_old__", "root_"."id", "root_"."verified", "root_"."person_id"  from "public"."contact" as "root_"  where "root_"."id" = ? and "root_"."verified" = ?)
						update  "public"."contact" set  "email" =  "newData_"."email"   from "newData_"  where "contact"."id" = "newData_"."id" and "newData_"."verified" = ?  returning "email_old__"`,
					parameters: ['john@example.com', testUuid(2), true, true],
					response: { rows: [{ email_old__: 'old@example.com' }] },
				},
			]),
		],
		return: {
			data: {
				updatePerson: {
					ok: true,
				},
			},
		},
	})
})

/** Both branches of a relation `upsert` are separate plumbing from the root `upsert` mutation. */
namespace ThroughRelationUpsert {
	export const editor = c.createRole('editor')

	@c.Allow(editor, { read: ['id'], update: ['id', 'locales'] })
	export class Post {
		locales = c.oneHasMany(PostLocale, 'post')
	}

	@c.Allow(editor, { read: ['id', 'post'] })
	@c.Allow(editor, {
		through: true,
		when: { locale: { eq: 'cs' } },
		update: ['title', 'post'],
		create: ['title', 'locale', 'post'],
	})
	export class PostLocale {
		title = c.stringColumn()
		locale = c.stringColumn()
		post = c.manyHasOne(Post, 'locales').notNull()
	}
}

const relationUpsertQuery = GQL`mutation {
        updatePost(
            by: {id: "${testUuid(1)}"},
            data: {locales: [{upsert: {
              by: {id: "${testUuid(2)}"},
              update: {title: "Hello"},
              create: {title: "World", locale: "cs"}
            }}]}
          ) {
          ok
        }
      }`

test('relation upsert - update branch uses the through grant', async () => {
	const schema = createSchema(ThroughRelationUpsert)
	const { root, all } = new PermissionFactory().createContextual(schema, ['editor'])

	await execute({
		schema: schema.model,
		permissions: root,
		nestedPermissions: all,
		query: relationUpsertQuery,
		executes: [
			...sqlTransaction([
				{
					sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`select "root_"."id" from "public"."post_locale" as "root_" where "root_"."id" = ? and "root_"."post_id" = ?`,
					parameters: [testUuid(2), testUuid(1)],
					response: { rows: [{ id: testUuid(2) }] },
				},
				{
					sql:
						SQL`with "newData_" as (select ? :: text as "title", "root_"."title" as "title_old__", "root_"."id", "root_"."locale", "root_"."post_id"  from "public"."post_locale" as "root_"  where "root_"."id" = ? and "root_"."locale" = ?)
						update  "public"."post_locale" set  "title" =  "newData_"."title"   from "newData_"  where "post_locale"."id" = "newData_"."id" and "newData_"."locale" = ?  returning "title_old__"`,
					parameters: ['Hello', testUuid(2), 'cs', 'cs'],
					response: { rows: [{ title_old__: 'Hi' }] },
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

test('relation upsert - create branch uses the through grant', async () => {
	const schema = createSchema(ThroughRelationUpsert)
	const { root, all } = new PermissionFactory().createContextual(schema, ['editor'])

	await execute({
		schema: schema.model,
		permissions: root,
		nestedPermissions: all,
		query: relationUpsertQuery,
		executes: [
			...sqlTransaction([
				{
					sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`select "root_"."id" from "public"."post_locale" as "root_" where "root_"."id" = ? and "root_"."post_id" = ?`,
					parameters: [testUuid(2), testUuid(1)],
					response: { rows: [] },
				},
				{
					sql: SQL`with "root_" as (select ? :: uuid as "id", ? :: text as "title", ? :: text as "locale", ? :: uuid as "post_id")
						insert into "public"."post_locale" ("id", "title", "locale", "post_id")
						select "root_"."id", "root_"."title", "root_"."locale", "root_"."post_id"  from "root_"  where "root_"."locale" = ?  returning "id"`,
					parameters: [testUuid(1), 'World', 'cs', testUuid(1), 'cs'],
					response: { rows: [{ id: testUuid(3) }] },
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

/** `Image` is updatable only through `Article.image`; the root mutation must not exist. */
namespace ThroughOnlyRootMutation {
	export const editor = c.createRole('editor')

	@c.Allow(editor, { read: ['id'], update: ['id', 'image'] })
	export class Article {
		image = c.oneHasOne(Image)
	}

	@c.Allow(editor, { read: ['id'] })
	@c.Allow(editor, { through: true, update: ['url'] })
	export class Image {
		url = c.stringColumn()
	}
}

test('through-only update grant opens no root update mutation', async () => {
	const schema = createSchema(ThroughOnlyRootMutation)
	const { root, all } = new PermissionFactory().createContextual(schema, ['editor'])

	// `updateArticle` is in the same document on purpose - only `updateImage` may be reported missing.
	await execute({
		schema: schema.model,
		permissions: root,
		nestedPermissions: all,
		query: GQL`mutation {
        a: updateArticle(by: {id: "${testUuid(1)}"}, data: {image: {update: {url: "https://example.com/a.png"}}}) {
          ok
        }
        b: updateImage(by: {id: "${testUuid(2)}"}, data: {url: "https://example.com/a.png"}) {
          ok
        }
      }`,
		executes: [],
		return: {
			errors: [{ message: 'Cannot query field "updateImage" on type "Mutation".' }],
		},
	})
})

/** `secret` is on the shared update type - types come from the nested set - but the root scope denies it. */
namespace MixedRootAndThroughUpdate {
	export const editor = c.createRole('editor')

	@c.Allow(editor, { read: ['id', 'name'], update: ['id', 'name'] })
	@c.Allow(editor, { through: true, update: ['secret'] })
	export class Author {
		name = c.stringColumn()
		secret = c.stringColumn()
	}
}

test('root update denies a field granted only through a relation', async () => {
	const schema = createSchema(MixedRootAndThroughUpdate)
	const { root, all } = new PermissionFactory().createContextual(schema, ['editor'])

	await execute({
		schema: schema.model,
		permissions: root,
		nestedPermissions: all,
		query: GQL`mutation {
        updateAuthor(
            by: {id: "${testUuid(1)}"},
            data: {secret: "hidden"}
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
					sql: SQL`select "root_"."id" from "public"."author" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql:
						SQL`with "newData_" as (select ? :: text as "secret", "root_"."secret" as "secret_old__", "root_"."id", "root_"."name"  from "public"."author" as "root_"  where false)
						update  "public"."author" set  "secret" =  "newData_"."secret"   from "newData_"  where "author"."id" = "newData_"."id" and false  returning "secret_old__"`,
					parameters: ['hidden'],
					response: { rows: [] },
				},
			]),
		],
		return: {
			data: {
				updateAuthor: {
					ok: false,
					errors: [{ type: 'NotFoundOrDenied' }],
				},
			},
		},
	})
})
