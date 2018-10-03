import { Model } from 'cms-common'
import { execute, sqlTransaction } from '../../../src/test'
import { GQL, SQL } from '../../../src/tags'
import { testUuid } from '../../../src/testUuid'
import SchemaBuilder from '../../../../src/content-schema/builder/SchemaBuilder'
import 'mocha'

describe('Insert mutation', () => {
	it('insert author (no relations)', async () => {
		await execute({
			schema: new SchemaBuilder()
				.entity('Author', entity => entity.column('name', c => c.type(Model.ColumnType.String)))
				.buildSchema(),
			query: GQL`
        mutation {
          createAuthor(data: {name: "John"}) {
            id
          }
        }`,
			executes: [
				...sqlTransaction([
					{
						sql: SQL`with "root_" as 
						(select $1 :: uuid as "id", $2 :: text as "name") 
						insert into "public"."author" ("id", "name") 
						select "root_"."id", "root_"."name"
            from "root_"
						returning "id"`,
						parameters: [testUuid(1), 'John'],
						response: { rows: [{ id: testUuid(1) }] },
					},
					{
						sql: SQL`select "root_"."id" as "root_id"
                     from "public"."author" as "root_"
                     where "root_"."id" = $1`,
						response: [{ root_id: testUuid(1) }],
						parameters: [testUuid(1)],
					},
				]),
			],
			return: {
				data: {
					createAuthor: {
						id: testUuid(1),
					},
				},
			},
		})
	})

	it('insert author (with acl)', async () => {
		await execute({
			schema: new SchemaBuilder()
				.entity('Author', entity => entity.column('name', c => c.type(Model.ColumnType.String)))
				.buildSchema(),
			permissions: {
				Author: {
					predicates: {
						name_predicate: { name: 'name_variable' },
					},
					operations: {
						create: {
							id: true,
							name: 'name_predicate',
						},
						read: {
							id: true,
						},
					},
				},
			},
			variables: {
				name_variable: ['John', 'Jack'],
			},
			query: GQL`
        mutation {
          createAuthor(data: {name: "John"}) {
            id
          }
        }`,
			executes: [
				...sqlTransaction([
					{
						sql: SQL`with "root_" as 
						(select $1 :: uuid as "id", $2 :: text as "name") 
						insert into "public"."author" ("id", "name") 
						select "root_"."id", "root_"."name"
            from "root_"
						where "root_"."name" in ($3, $4)
						returning "id"`,
						parameters: [testUuid(1), 'John', 'John', 'Jack'],
						response: { rows: [{ id: testUuid(1) }] },
					},
					{
						sql: SQL`select "root_"."id" as "root_id"
                     from "public"."author" as "root_"
                     where "root_"."id" = $1`,
						response: [{ root_id: testUuid(1) }],
						parameters: [testUuid(1)],
					},
				]),
			],
			return: {
				data: {
					createAuthor: {
						id: testUuid(1),
					},
				},
			},
		})
	})

	it('insert site with settings (one has one owner relation', async () => {
		await execute({
			schema: new SchemaBuilder()
				.entity('Site', entity =>
					entity
						.column('name', c => c.type(Model.ColumnType.String))
						.oneHasOne('setting', r => r.target('SiteSetting').inversedBy('site'))
				)
				.entity('SiteSetting', e => e.column('url', c => c.type(Model.ColumnType.String)))
				.buildSchema(),
			query: GQL`
        mutation {
          createSite(data: {name: "Mangoweb", setting: {create: {url: "https://mangoweb.cz"}}}) {
            id
          }
        }`,
			executes: [
				...sqlTransaction([
					{
						sql: SQL`with "root_" as 
						(select $1 :: uuid as "id", $2 :: text as "url") 
						insert into "public"."site_setting" ("id", "url") 
						select "root_"."id", "root_"."url"
            from "root_"
						returning "id"`,
						parameters: [testUuid(2), 'https://mangoweb.cz'],
						response: { rows: [{ id: testUuid(2) }] },
					},
					{
						sql: SQL`with "root_" as 
						(select $1 :: uuid as "id", $2 :: text as "name", $3 :: uuid as "setting_id") 
						insert into "public"."site" ("id", "name", "setting_id") 
						select "root_"."id", "root_"."name", "root_"."setting_id"
            from "root_"
						returning "id"`,
						parameters: [testUuid(1), 'Mangoweb', testUuid(2)],
						response: { rows: [{ id: testUuid(1) }] },
					},
					{
						sql: SQL`select "root_"."id" as "root_id"
                     from "public"."site" as "root_"
                     where "root_"."id" = $1`,
						response: [{ root_id: testUuid(1) }],
						parameters: [testUuid(1)],
					},
				]),
			],
			return: {
				data: {
					createSite: {
						id: testUuid(1),
					},
				},
			},
		})
	})

	it('insert setting with site (one has one inversed relation)', async () => {
		await execute({
			schema: new SchemaBuilder()
				.entity('Site', entity =>
					entity
						.column('name', c => c.type(Model.ColumnType.String))
						.oneHasOne('setting', r => r.target('SiteSetting').inversedBy('site'))
				)
				.entity('SiteSetting', e => e.column('url', c => c.type(Model.ColumnType.String)))
				.buildSchema(),
			query: GQL`
        mutation {
          createSiteSetting(data: {url: "https://mangoweb.cz", site: {create: {name: "Mangoweb"}}}) {
            id
          }
        }`,
			executes: [
				...sqlTransaction([
					{
						sql: SQL`with "root_" as 
						(select $1 :: uuid as "id", $2 :: text as "url") 
						insert into "public"."site_setting" ("id", "url") 
						select "root_"."id", "root_"."url"
            from "root_"
						returning "id"`,
						parameters: [testUuid(1), 'https://mangoweb.cz'],
						response: { rows: [{ id: testUuid(1) }] },
					},
					{
						sql: SQL`with "root_" as 
						(select $1 :: uuid as "id", $2 :: text as "name", $3 :: uuid as "setting_id") 
						insert into "public"."site" ("id", "name", "setting_id") 
						select "root_"."id", "root_"."name", "root_"."setting_id"
            from "root_"
						returning "id"`,
						parameters: [testUuid(2), 'Mangoweb', testUuid(1)],
						response: { rows: [{ id: testUuid(2) }] },
					},
					{
						sql: SQL`select "root_"."id" as "root_id"
                     from "public"."site_setting" as "root_"
                     where "root_"."id" = $1`,
						response: [{ root_id: testUuid(1) }],
						parameters: [testUuid(1)],
					},
				]),
			],
			return: {
				data: {
					createSiteSetting: {
						id: testUuid(1),
					},
				},
			},
		})
	})

	it('insert posts with author (many has one)', async () => {
		await execute({
			schema: new SchemaBuilder()
				.entity('Post', e =>
					e.column('publishedAt', c => c.type(Model.ColumnType.DateTime)).manyHasOne('author', r => r.target('Author'))
				)
				.entity('Author', e => e.column('name', c => c.type(Model.ColumnType.String)))
				.buildSchema(),
			query: GQL`
        mutation {
          createPost(data: {
            publishedAt: "2018-06-11",
            author: {create: {name: "John"}}
          }) {
            id
          }
        }
      `,
			executes: [
				...sqlTransaction([
					{
						sql: SQL`with "root_" as 
						(select $1 :: uuid as "id", $2 :: text as "name") 
						insert into "public"."author" ("id", "name") 
						select "root_"."id", "root_"."name"
            from "root_"
						returning "id"`,
						parameters: [testUuid(2), 'John'],
						response: { rows: [{ id: testUuid(2) }] },
					},
					{
						sql: SQL`with "root_" as 
						(select $1 :: uuid as "id", $2 :: timestamp as "published_at", $3 :: uuid as "author_id") 
						insert into "public"."post" ("id", "published_at", "author_id") 
						select "root_"."id", "root_"."published_at", "root_"."author_id"
            from "root_"
						returning "id"`,
						parameters: [testUuid(1), '2018-06-11', testUuid(2)],
						response: { rows: [{ id: testUuid(1) }] },
					},
					{
						sql: SQL`select "root_"."id" as "root_id"
                     from "public"."post" as "root_"
                     where "root_"."id" = $1`,
						response: [{ root_id: testUuid(1) }],
						parameters: [testUuid(1)],
					},
				]),
			],
			return: {
				data: {
					createPost: {
						id: testUuid(1),
					},
				},
			},
		})
	})

	it('insert posts with locales (one has many)', async () => {
		await execute({
			schema: new SchemaBuilder()
				.enum('locale', ['cs', 'en'])
				.entity('Post', e =>
					e
						.column('publishedAt', c => c.type(Model.ColumnType.DateTime))
						.oneHasMany('locales', r => r.target('PostLocale'))
				)
				.entity('PostLocale', e =>
					e
						.column('locale', c => c.type(Model.ColumnType.Enum, { enumName: 'locale' }))
						.column('title', c => c.type(Model.ColumnType.String))
				)
				.buildSchema(),
			query: GQL`
        mutation {
          createPost(data: {
            publishedAt: "2018-06-11",
            locales: [
              {create: {locale: cs, title: "Ahoj svete"}}
              {create: {locale: en, title: "Hello world"}}
            ]
          }) {
            id
          }
        }
      `,
			executes: [
				...sqlTransaction([
					{
						sql: SQL`with "root_" as 
						(select $1 :: uuid as "id", $2 :: timestamp as "published_at") 
						insert into "public"."post" ("id", "published_at") 
						select "root_"."id", "root_"."published_at"
            from "root_"
						returning "id"`,
						parameters: [testUuid(1), '2018-06-11'],
						response: { rows: [{ id: testUuid(1) }] },
					},
					{
						sql: SQL`with "root_" as 
						(select $1 :: uuid as "post_id", $2 :: uuid as "id", $3 :: text as "locale", $4 :: text as "title") 
						insert into "public"."post_locale" ("post_id", "id", "locale", "title") 
						select "root_"."post_id", "root_"."id", "root_"."locale", "root_"."title"
            from "root_"
						returning "id"`,
						parameters: [testUuid(1), testUuid(2), 'cs', 'Ahoj svete'],
						response: { rows: [{ id: testUuid(2) }] },
					},
					{
						sql: SQL`with "root_" as 
						(select $1 :: uuid as "post_id", $2 :: uuid as "id", $3 :: text as "locale", $4 :: text as "title") 
						insert into "public"."post_locale" ("post_id", "id", "locale", "title") 
						select "root_"."post_id", "root_"."id", "root_"."locale", "root_"."title"
            from "root_"
						returning "id"`,
						parameters: [testUuid(1), testUuid(3), 'en', 'Hello world'],
						response: { rows: [{ id: testUuid(3) }] },
					},
					{
						sql: SQL`select "root_"."id" as "root_id"
                     from "public"."post" as "root_"
                     where "root_"."id" = $1`,
						response: [{ root_id: testUuid(1) }],
						parameters: [testUuid(1)],
					},
				]),
			],
			return: {
				data: {
					createPost: {
						id: testUuid(1),
					},
				},
			},
		})
	})

	it('insert post with categories (many has many, owning)', async () => {
		await execute({
			schema: new SchemaBuilder()
				.entity('Post', e =>
					e.column('name', c => c.type(Model.ColumnType.String)).manyHasMany('categories', r => r.target('Category'))
				)
				.entity('Category', e => e.column('name', c => c.type(Model.ColumnType.String)))
				.buildSchema(),
			query: GQL`
        mutation {
          createPost(data: {name: "Hello world", categories: [{create: {name: "Category 1"}}, {create: {name: "Category 2"}}]}) {
            id
          }
        }
      `,
			executes: [
				...sqlTransaction([
					{
						sql: SQL`with "root_" as 
						(select $1 :: uuid as "id", $2 :: text as "name") 
						insert into "public"."post" ("id", "name") 
						select "root_"."id", "root_"."name"
            from "root_"
						returning "id"`,
						parameters: [testUuid(1), 'Hello world'],
						response: { rows: [{ id: testUuid(1) }] },
					},
					{
						sql: SQL`with "root_" as 
						(select $1 :: uuid as "id", $2 :: text as "name") 
						insert into "public"."category" ("id", "name") 
						select "root_"."id", "root_"."name"
            from "root_"
						returning "id"`,
						parameters: [testUuid(2), 'Category 1'],
						response: { rows: [{ id: testUuid(2) }] },
					},
					{
						sql: SQL`with "root_" as 
						(select $1 :: uuid as "id", $2 :: text as "name") 
						insert into "public"."category" ("id", "name") 
						select "root_"."id", "root_"."name"
            from "root_"
						returning "id"`,
						parameters: [testUuid(3), 'Category 2'],
						response: { rows: [{ id: testUuid(3) }] },
					},
					{
						sql: SQL`insert into "public"."post_categories" ("category_id", "post_id")
          values ($1, $2)
          on conflict do nothing`,
						parameters: [testUuid(2), testUuid(1)],
						response: 1,
					},
					{
						sql: SQL`insert into "public"."post_categories" ("category_id", "post_id")
          values ($1, $2)
          on conflict do nothing`,
						parameters: [testUuid(3), testUuid(1)],
						response: 1,
					},
					{
						sql: SQL`select "root_"."id" as "root_id"
                     from "public"."post" as "root_"
                     where "root_"."id" = $1`,
						response: [{ root_id: testUuid(1) }],
						parameters: [testUuid(1)],
					},
				]),
			],
			return: {
				data: {
					createPost: {
						id: testUuid(1),
					},
				},
			},
		})
	})

	it('insert category with posts (many has many, inversed)', async () => {
		await execute({
			schema: new SchemaBuilder()
				.entity('Post', e =>
					e
						.column('name', c => c.type(Model.ColumnType.String))
						.manyHasMany('categories', r => r.target('Category').inversedBy('posts'))
				)
				.entity('Category', e => e.column('name', c => c.type(Model.ColumnType.String)))
				.buildSchema(),
			query: GQL`
        mutation {
          createCategory(data: {name: "Hello world", posts: [{create: {name: "Post 1"}}, {create: {name: "Post 2"}}]}) {
            id
          }
        }
      `,
			executes: [
				...sqlTransaction([
					{
						sql: SQL`with "root_" as 
						(select $1 :: uuid as "id", $2 :: text as "name") 
						insert into "public"."category" ("id", "name") 
						select "root_"."id", "root_"."name"
            from "root_"
						returning "id"`,
						parameters: [testUuid(1), 'Hello world'],
						response: { rows: [{ id: testUuid(1) }] },
					},
					{
						sql: SQL`with "root_" as 
						(select $1 :: uuid as "id", $2 :: text as "name") 
						insert into "public"."post" ("id", "name") 
						select "root_"."id", "root_"."name"
            from "root_"
						returning "id"`,
						parameters: [testUuid(2), 'Post 1'],
						response: { rows: [{ id: testUuid(2) }] },
					},
					{
						sql: SQL`with "root_" as 
						(select $1 :: uuid as "id", $2 :: text as "name") 
						insert into "public"."post" ("id", "name") 
						select "root_"."id", "root_"."name"
            from "root_"
						returning "id"`,
						parameters: [testUuid(3), 'Post 2'],
						response: { rows: [{ id: testUuid(3) }] },
					},
					{
						sql: SQL`insert into "public"."post_categories" ("category_id", "post_id")
          values ($1, $2)
          on conflict do nothing`,
						parameters: [testUuid(1), testUuid(2)],
						response: 1,
					},
					{
						sql: SQL`insert into "public"."post_categories" ("category_id", "post_id")
          values ($1, $2)
          on conflict do nothing`,
						parameters: [testUuid(1), testUuid(3)],
						response: 1,
					},
					{
						sql: SQL`select "root_"."id" as "root_id"
                     from "public"."category" as "root_"
                     where "root_"."id" = $1`,
						response: [{ root_id: testUuid(1) }],
						parameters: [testUuid(1)],
					},
				]),
			],
			return: {
				data: {
					createCategory: {
						id: testUuid(1),
					},
				},
			},
		})
	})
})
