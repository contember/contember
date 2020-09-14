import { Model } from '@contember/schema'
import { execute, SqlQuery, sqlTransaction } from '../../../src/test'
import { GQL, SQL } from '../../../src/tags'
import { testUuid } from '../../../src/testUuid'
import { SchemaBuilder } from '@contember/schema-definition'
import 'jasmine'

const noTransaction = (sqls: SqlQuery[]) => sqls

describe('Queries', () => {
	it('Post by id query', async () => {
		await execute({
			schema: new SchemaBuilder()
				.entity('Post', entity => entity.column('title', column => column.type(Model.ColumnType.String)))
				.buildSchema(),
			query: GQL`
        query {
          getPost(by: {id: "${testUuid(1)}"}) {
            id
          }
        }`,
			executes: [
				...noTransaction([
					{
						sql: SQL`select "root_"."id" as "root_id"
                     from "public"."post" as "root_"
                     where "root_"."id" = ?`,
						response: { rows: [{ root_id: testUuid(1) }] },
						parameters: [testUuid(1)],
					},
				]),
			],
			return: {
				data: {
					getPost: {
						id: testUuid(1),
					},
				},
			},
		})
	})

	it('Post title contains', async () => {
		await execute({
			schema: new SchemaBuilder()
				.entity('Post', entity => entity.column('title', column => column.type(Model.ColumnType.String)))
				.buildSchema(),
			query: GQL`
        query {
          listPost(filter: {title: {contains: "Hello%world"}}) {
            id
          }
        }`,
			executes: [
				...noTransaction([
					{
						sql: SQL`
							select "root_"."id" as "root_id"
							from "public"."post" as "root_"
							where "root_"."title" like '%' || ? || '%'`,
						response: { rows: [{ root_id: testUuid(1) }] },
						parameters: ['Hello\\%world'],
					},
				]),
			],
			return: {
				data: {
					listPost: [
						{
							id: testUuid(1),
						},
					],
				},
			},
		})
	})

	it('Post locale by post and locale (composed unique)', async () => {
		await execute({
			schema: new SchemaBuilder()
				.entity('Post', entity =>
					entity
						.column('title', column => column.type(Model.ColumnType.String))
						.oneHasMany('locales', relation => relation.target('PostLocale').ownedBy('post')),
				)
				.entity('PostLocale', entity =>
					entity
						.unique(['locale', 'post'])
						.column('locale', column => column.type(Model.ColumnType.String))
						.column('title', column => column.type(Model.ColumnType.String)),
				)
				.buildSchema(),
			query: GQL`
        query {
          getPostLocale(by: {post: {id: "${testUuid(1)}"}, locale: "cs"}) {
            id
          }
        }`,
			executes: [
				...noTransaction([
					{
						sql: SQL`select "root_"."id" as "root_id"
                     from "public"."post_locale" as "root_"
                     where "root_"."locale" = ? and "root_"."post_id" = ?`,
						parameters: ['cs', testUuid(1)],
						response: { rows: [{ root_id: testUuid(2) }] },
					},
				]),
			],
			return: {
				data: {
					getPostLocale: {
						id: testUuid(2),
					},
				},
			},
		})
	})

	it('Post by post locale (one-has-many unique)', async () => {
		await execute({
			schema: new SchemaBuilder()
				.entity('Post', entity =>
					entity
						.column('title', column => column.type(Model.ColumnType.String))
						.oneHasMany('locales', relation => relation.target('PostLocale').ownedBy('post')),
				)
				.entity('PostLocale', entity =>
					entity
						.unique(['locale', 'post'])
						.column('locale', column => column.type(Model.ColumnType.String))
						.column('title', column => column.type(Model.ColumnType.String)),
				)
				.buildSchema(),
			query: GQL`
        query {
          getPost(by: {locales: {id: "${testUuid(1)}"}}) {
            id
          }
        }`,
			executes: [
				...noTransaction([
					{
						sql: SQL`SELECT "root_"."id" AS "root_id"
						         FROM "public"."post" AS "root_"
						         WHERE "root_"."id" IN (SELECT "root_"."post_id" FROM "public"."post_locale" AS "root_" WHERE "root_"."id" = ?)`,
						parameters: [testUuid(1)],
						response: { rows: [{ root_id: testUuid(2) }] },
					},
				]),
			],
			return: {
				data: {
					getPost: {
						id: testUuid(2),
					},
				},
			},
		})
	})

	it('Field alias', async () => {
		await execute({
			schema: new SchemaBuilder()
				.entity('Post', entity => entity.column('title', column => column.type(Model.ColumnType.String)))
				.buildSchema(),
			query: GQL`
        query {
          getPost(by: {id: "${testUuid(1)}"}) {
            heading: title
          }
        }`,
			executes: [
				...noTransaction([
					{
						sql: SQL`select
                       "root_"."title" as "root_heading",
                       "root_"."id" as "root_id"
                     from "public"."post" as "root_"
                     where "root_"."id" = ?`,
						response: { rows: [{ root_heading: 'Hello' }] },
						parameters: [testUuid(1)],
					},
				]),
			],
			return: {
				data: {
					getPost: {
						heading: 'Hello',
					},
				},
			},
		})
	})

	it('Posts with locales query (one has many)', async () => {
		await execute({
			schema: new SchemaBuilder()
				.entity('Post', entity =>
					entity.oneHasMany('locales', relation => relation.target('PostLocale').ownedBy('post')),
				)
				.entity('PostLocale', entity =>
					entity
						.column('locale', column => column.type(Model.ColumnType.String))
						.column('title', column => column.type(Model.ColumnType.String)),
				)
				.buildSchema(),
			query: GQL`
        query {
          listPost {
            id
            locales {
              id
              locale
              title
            }
          }
        }
			`,
			executes: [
				...noTransaction([
					{
						sql: SQL`select
                       "root_"."id" as "root_id",
                       "root_"."id" as "root_id"
                     from "public"."post" as "root_"`,
						response: { rows: [{ root_id: testUuid(1) }, { root_id: testUuid(2) }] },
					},
					{
						sql: SQL`select
                       "root_"."post_id" as "__grouping_key",
                       "root_"."id" as "root_id",
                       "root_"."locale" as "root_locale",
                       "root_"."title" as "root_title"
                     from "public"."post_locale" as "root_"
                     where "root_"."post_id" in (?, ?)`,
						parameters: [testUuid(1), testUuid(2)],
						response: {
							rows: [
								{ root_id: testUuid(3), root_locale: 'cs', root_title: 'ahoj svete', __grouping_key: testUuid(1) },
								{ root_id: testUuid(4), root_locale: 'en', root_title: 'hello world', __grouping_key: testUuid(1) },
								{ root_id: testUuid(5), root_locale: 'cs', root_title: 'dalsi clanek', __grouping_key: testUuid(2) },
							],
						},
					},
				]),
			],
			return: {
				data: {
					listPost: [
						{
							id: testUuid(1),
							locales: [
								{
									id: testUuid(3),
									locale: 'cs',
									title: 'ahoj svete',
								},
								{
									id: testUuid(4),
									locale: 'en',
									title: 'hello world',
								},
							],
						},
						{
							id: testUuid(2),
							locales: [
								{
									id: testUuid(5),
									locale: 'cs',
									title: 'dalsi clanek',
								},
							],
						},
					],
				},
			},
		})
	})

	it('Post with author query (many has one)', async () => {
		await execute({
			schema: new SchemaBuilder()
				.entity('Post', entity => entity.manyHasOne('author', relation => relation.target('Author')))
				.entity('Author', entity => entity.column('name', column => column.type(Model.ColumnType.String)))
				.buildSchema(),
			query: GQL`
        query {
          listPost {
            id
            author {
              id
              name
            }
          }
        }`,
			executes: [
				...noTransaction([
					{
						sql: SQL`
              select
                "root_"."id" as "root_id",
                "root_"."author_id" as "root_author"
              from "public"."post" as "root_"
						`,
						response: {
							rows: [
								{
									root_id: testUuid(1),
									root_author: testUuid(2),
								},
								{
									root_id: testUuid(3),
									root_author: testUuid(4),
								},
							],
						},
					},
					{
						sql: SQL`
              select
                "root_"."id" as "root_id",
                "root_"."id" as "root_id",
                "root_"."name" as "root_name"
              from "public"."author" as "root_"
              where "root_"."id" in (?, ?)
						`,
						parameters: [testUuid(2), testUuid(4)],
						response: {
							rows: [
								{
									root_id: testUuid(2),
									root_name: 'John',
								},
								{
									root_id: testUuid(4),
									root_name: 'Jack',
								},
							],
						},
					},
				]),
			],
			return: {
				data: {
					listPost: [
						{
							id: testUuid(1),
							author: {
								id: testUuid(2),
								name: 'John',
							},
						},
						{
							id: testUuid(3),
							author: {
								id: testUuid(4),
								name: 'Jack',
							},
						},
					],
				},
			},
		})
	})

	it('Post with author query with no result', async () => {
		await execute({
			schema: new SchemaBuilder()
				.entity('Post', entity => entity.manyHasOne('author', relation => relation.target('Author')))
				.entity('Author', entity => entity.column('name', column => column.type(Model.ColumnType.String)))
				.buildSchema(),
			query: GQL`
        query {
          listPost {
            id
            author {
              id
              name
            }
          }
        }`,
			executes: [
				...noTransaction([
					{
						sql: SQL`
              select
                "root_"."id" as "root_id",
                "root_"."author_id" as "root_author"
              from "public"."post" as "root_"
						`,
						response: {
							rows: [],
						},
					},
				]),
			],
			return: {
				data: {
					listPost: [],
				},
			},
		})
	})

	it('Sites with settings (one-has-one owner)', async () => {
		await execute({
			schema: new SchemaBuilder()
				.entity('Site', entity =>
					entity
						.column('name', column => column.type(Model.ColumnType.String))
						.oneHasOne('setting', relation => relation.target('SiteSetting')),
				)
				.entity('SiteSetting', entity => entity.column('url', column => column.type(Model.ColumnType.String)))
				.buildSchema(),
			query: GQL`query {
        listSite {
          id
          name
          setting {
            id
            url
          }
        }
      }`,
			executes: [
				...noTransaction([
					{
						sql: SQL`
              select
                "root_"."id" as "root_id",
                "root_"."name" as "root_name",
                "root_"."setting_id" as "root_setting"
              from "public"."site" as "root_"`,

						response: {
							rows: [
								{
									root_id: testUuid(1),
									root_name: 'Site 1',
									root_setting: testUuid(2),
								},
								{
									root_id: testUuid(3),
									root_name: 'Site 2',
									root_setting: testUuid(4),
								},
							],
						},
					},
					{
						sql: SQL`
              select
                "root_"."id" as "root_id",
                "root_"."id" as "root_id",
                "root_"."url" as "root_url"
              from "public"."site_setting" as "root_"
              where "root_"."id" in (?, ?)
						`,
						parameters: [testUuid(2), testUuid(4)],
						response: {
							rows: [
								{
									root_id: testUuid(2),
									root_url: 'http://site1.cz',
								},
								{
									root_id: testUuid(4),
									root_url: 'http://site2.cz',
								},
							],
						},
					},
				]),
			],
			return: {
				data: {
					listSite: [
						{
							id: testUuid(1),
							name: 'Site 1',
							setting: {
								id: testUuid(2),
								url: 'http://site1.cz',
							},
						},
						{
							id: testUuid(3),
							name: 'Site 2',
							setting: {
								id: testUuid(4),
								url: 'http://site2.cz',
							},
						},
					],
				},
			},
		})
	})

	it('Settings with sites (one-has-one inversed)', async () => {
		await execute({
			schema: new SchemaBuilder()
				.entity('Site', entity =>
					entity
						.column('name', column => column.type(Model.ColumnType.String))
						.oneHasOne('setting', relation => relation.target('SiteSetting').inversedBy('site')),
				)
				.entity('SiteSetting', entity => entity.column('url', column => column.type(Model.ColumnType.String)))
				.buildSchema(),
			query: GQL`query {
        listSiteSetting {
          id
          url
          site {
            id
            name
          }
        }
      }`,
			executes: [
				...noTransaction([
					{
						sql: SQL`select
                       "root_"."id" as "root_id",
                       "root_"."url" as "root_url",
                       "root_"."id" as "root_id"
                     from "public"."site_setting" as "root_"`,
						response: {
							rows: [
								{
									root_id: testUuid(1),
									root_url: 'http://site1.cz',
								},
								{
									root_id: testUuid(3),
									root_url: 'http://site2.cz',
								},
							],
						},
					},
					{
						sql: SQL`select
                       "root_"."setting_id" as "root_setting",
                       "root_"."id" as "root_id",
                       "root_"."name" as "root_name"
                     from "public"."site" as "root_"
                     where "root_"."setting_id" in (?, ?)`,
						parameters: [testUuid(1), testUuid(3)],
						response: {
							rows: [
								{
									root_id: testUuid(2),
									root_setting: testUuid(1),
									root_name: 'Site 1',
								},
								{
									root_id: testUuid(4),
									root_setting: testUuid(3),
									root_name: 'Site 2',
								},
							],
						},
					},
				]),
			],
			return: {
				data: {
					listSiteSetting: [
						{
							id: testUuid(1),
							url: 'http://site1.cz',
							site: {
								id: testUuid(2),
								name: 'Site 1',
							},
						},
						{
							id: testUuid(3),
							url: 'http://site2.cz',
							site: {
								name: 'Site 2',
								id: testUuid(4),
							},
						},
					],
				},
			},
		})
	})

	it('Posts with categories and its cz locale (many has many owner + one has many)', async () => {
		await execute({
			schema: new SchemaBuilder()
				.enum('locale', ['cs', 'en'])
				.entity('Post', entity => entity.manyHasMany('categories', relation => relation.target('Category')))
				.entity('Category', entity =>
					entity
						.column('visible', c => c.type(Model.ColumnType.Bool))
						.oneHasMany('locales', relation => relation.target('CategoryLocale')),
				)
				.entity('CategoryLocale', entity =>
					entity
						.column('name', column => column.type(Model.ColumnType.String))
						.column('locale', column => column.type(Model.ColumnType.Enum, { enumName: 'locale' })),
				)
				.buildSchema(),
			query: GQL`
        query {
          listPost {
            id
            categories {
              id
              visible
              locales(filter: {locale: {eq: cs}}) {
                id
                name
              }
            }
          }
        }`,
			executes: [
				...noTransaction([
					{
						sql: SQL`select
                       "root_"."id" as "root_id",
                       "root_"."id" as "root_id"
                     from "public"."post" as "root_"`,
						response: {
							rows: [
								{
									root_id: testUuid(1),
								},
								{
									root_id: testUuid(2),
								},
							],
						},
					},
					{
						sql: SQL`select
                       "junction_"."category_id",
                       "junction_"."post_id"
                     from "public"."post_categories" as "junction_"
                     where "junction_"."post_id" in (?, ?)`,
						parameters: [testUuid(1), testUuid(2)],
						response: {
							rows: [
								{
									category_id: testUuid(3),
									post_id: testUuid(1),
								},
								{
									category_id: testUuid(4),
									post_id: testUuid(1),
								},
								{
									category_id: testUuid(5),
									post_id: testUuid(2),
								},
								{
									category_id: testUuid(3),
									post_id: testUuid(2),
								},
							],
						},
					},
					{
						sql: SQL`select
                       "root_"."visible" as "root_visible",
                       "root_"."id" as "root_id",
                       "root_"."id" as "root_id"
                     from "public"."category" as "root_"
                     where "root_"."id" in (?, ?, ?)`,
						parameters: [testUuid(3), testUuid(4), testUuid(5)],
						response: {
							rows: [
								{
									root_id: testUuid(3),
									root_visible: true,
								},
								{
									root_id: testUuid(4),
									root_visible: true,
								},
								{
									root_id: testUuid(5),
									root_visible: true,
								},
							],
						},
					},
					{
						sql: SQL`
              select
                "root_"."category_id" as "__grouping_key",
                "root_"."id" as "root_id",
                "root_"."name" as "root_name"
              from "public"."category_locale" as "root_"
              where "root_"."locale" = ? and "root_"."category_id" in (?, ?, ?)
						`,
						parameters: ['cs', testUuid(3), testUuid(4), testUuid(5)],
						response: {
							rows: [
								{
									root_id: testUuid(6),
									root_name: 'Kategorie 1',
									__grouping_key: testUuid(3),
								},
								{
									root_id: testUuid(7),
									root_name: 'Kategorie 2',
									__grouping_key: testUuid(4),
								},
								{
									root_id: testUuid(8),
									root_name: 'Kategorie 3',
									__grouping_key: testUuid(5),
								},
							],
						},
					},
				]),
			],
			return: {
				data: {
					listPost: [
						{
							categories: [
								{
									id: testUuid(3),
									visible: true,
									locales: [
										{
											id: testUuid(6),
											name: 'Kategorie 1',
										},
									],
								},
								{
									id: testUuid(4),
									visible: true,
									locales: [
										{
											id: testUuid(7),
											name: 'Kategorie 2',
										},
									],
								},
							],
							id: testUuid(1),
						},
						{
							categories: [
								{
									id: testUuid(5),
									visible: true,
									locales: [
										{
											id: testUuid(8),
											name: 'Kategorie 3',
										},
									],
								},
								{
									id: testUuid(3),
									visible: true,
									locales: [
										{
											id: testUuid(6),
											name: 'Kategorie 1',
										},
									],
								},
							],
							id: testUuid(2),
						},
					],
				},
			},
		})
	})

	it('Categories with posts and author (many has many inversed + many has one)', async () => {
		await execute({
			schema: new SchemaBuilder()
				.entity('Post', entity =>
					entity
						.manyHasMany('categories', relation => relation.target('Category').inversedBy('posts'))
						.manyHasOne('author', relation => relation.target('Author')),
				)
				.entity('Category', entity => entity)
				.entity('Author', entity => entity.column('name', column => column.type(Model.ColumnType.String)))
				.buildSchema(),
			query: GQL`
        query {
          listCategory {
            id
            posts {
              id
              author {
                name
              }
            }
          }
        }`,
			executes: [
				...noTransaction([
					{
						sql: SQL`select
                       "root_"."id" as "root_id",
                       "root_"."id" as "root_id"
                     from "public"."category" as "root_"`,
						response: {
							rows: [
								{
									root_id: testUuid(1),
								},
								{
									root_id: testUuid(2),
								},
							],
						},
					},
					{
						sql: SQL`select
                       "junction_"."category_id",
                       "junction_"."post_id"
                     from "public"."post_categories" as "junction_"
                     where "junction_"."category_id" in (?, ?)`,
						parameters: [testUuid(1), testUuid(2)],
						response: {
							rows: [
								{
									category_id: testUuid(1),
									post_id: testUuid(3),
								},
								{
									category_id: testUuid(1),
									post_id: testUuid(4),
								},
								{
									category_id: testUuid(2),
									post_id: testUuid(4),
								},
								{
									category_id: testUuid(2),
									post_id: testUuid(5),
								},
							],
						},
					},
					{
						sql: SQL`select
                       "root_"."author_id" as "root_author",
                       "root_"."id" as "root_id"
                     from "public"."post" as "root_"
                     where "root_"."id" in (?, ?, ?)
						`,
						parameters: [testUuid(3), testUuid(4), testUuid(5)],
						response: {
							rows: [
								{
									root_id: testUuid(3),
									root_author: testUuid(6),
								},
								{
									root_id: testUuid(4),
									root_author: testUuid(7),
								},
								{
									root_id: testUuid(5),
									root_author: testUuid(7),
								},
							],
						},
					},
					{
						sql: SQL`select
                       "root_"."id" as "root_id",
                       "root_"."name" as "root_name",
                       "root_"."id" as "root_id"
                     from "public"."author" as "root_"
                     where "root_"."id" in (?, ?)
						`,
						parameters: [testUuid(6), testUuid(7)],
						response: {
							rows: [
								{
									root_id: testUuid(6),
									root_name: 'John',
								},
								{
									root_id: testUuid(7),
									root_name: 'Jack',
								},
							],
						},
					},
				]),
			],
			return: {
				data: {
					listCategory: [
						{
							id: testUuid(1),
							posts: [
								{
									author: {
										name: 'John',
									},
									id: testUuid(3),
								},
								{
									author: {
										name: 'Jack',
									},
									id: testUuid(4),
								},
							],
						},
						{
							id: testUuid(2),
							posts: [
								{
									author: {
										name: 'Jack',
									},
									id: testUuid(4),
								},
								{
									author: {
										name: 'Jack',
									},
									id: testUuid(5),
								},
							],
						},
					],
				},
			},
		})
	})

	it('Post by author name (where one has many)', async () => {
		await execute({
			schema: new SchemaBuilder()
				.entity('Post', entity => entity.manyHasOne('author', relation => relation.target('Author')))
				.entity('Author', entity => entity.column('name', column => column.type(Model.ColumnType.String)))
				.buildSchema(),
			query: GQL`
        query {
          listPost(filter: {author: {name: {eq: "John"}}}) {
            id
          }
        }`,
			executes: [
				...noTransaction([
					{
						sql: SQL`select
                       "root_"."id" as "root_id"
                     from "public"."post" as "root_" left join "public"."author" as "root_author" on "root_"."author_id" = "root_author"."id"
                     where "root_author"."name" = ?`,
						parameters: ['John'],
						response: {
							rows: [
								{
									root_id: testUuid(1),
								},
								{
									root_id: testUuid(3),
								},
							],
						},
					},
				]),
			],
			return: {
				data: {
					listPost: [
						{
							id: testUuid(1),
						},
						{
							id: testUuid(3),
						},
					],
				},
			},
		})
	})

	it('Author by post title (where many has one)', async () => {
		await execute({
			schema: new SchemaBuilder()
				.entity('Post', entity =>
					entity
						.manyHasOne('author', relation => relation.target('Author').inversedBy('posts'))
						.column('title', column => column.type(Model.ColumnType.String)),
				)
				.entity('Author', entity => entity.column('name', column => column.type(Model.ColumnType.String)))
				.buildSchema(),
			query: GQL`
        query {
          listAuthor(filter: {posts: {title: {eq: "Hello"}}}) {
            id
          }
        }`,
			executes: [
				...noTransaction([
					{
						sql: SQL`select "root_"."id" as "root_id"
                     from "public"."author" as "root_"
                     where "root_"."id" in (select "root_"."author_id"
                                            from "public"."post" as "root_"
                                            where "root_"."title" = ?)`,
						parameters: ['Hello'],
						response: {
							rows: [
								{
									root_id: testUuid(1),
								},
								{
									root_id: testUuid(3),
								},
							],
						},
					},
				]),
			],
			return: {
				data: {
					listAuthor: [
						{
							id: testUuid(1),
						},
						{
							id: testUuid(3),
						},
					],
				},
			},
		})
	})

	it('Post by category name (where many has many owner)', async () => {
		await execute({
			schema: new SchemaBuilder()
				.entity('Post', entity =>
					entity.manyHasMany('categories', relation =>
						relation.target('Category', e => e.column('name', c => c.type(Model.ColumnType.String))),
					),
				)
				.buildSchema(),
			query: GQL`
        query {
          listPost(filter: {categories: {name: {eq: "Stuff"}}}) {
            id
          }
        }`,
			executes: [
				...noTransaction([
					{
						sql: SQL`select "root_"."id" as "root_id"
                     from "public"."post" as "root_"
                     where "root_"."id" in (select "junction_"."post_id"
                                            from "public"."post_categories" as "junction_" inner join "public"."category" as "root_" on "junction_"."category_id" = "root_"."id"
                                            where "root_"."name" = ?)`,
						parameters: ['Stuff'],
						response: {
							rows: [
								{
									root_id: testUuid(1),
								},
								{
									root_id: testUuid(3),
								},
							],
						},
					},
				]),
			],
			return: {
				data: {
					listPost: [
						{
							id: testUuid(1),
						},
						{
							id: testUuid(3),
						},
					],
				},
			},
		})
	})

	it('Post by category ids (where many has many owner)', async () => {
		await execute({
			schema: new SchemaBuilder()
				.entity('Post', entity =>
					entity.manyHasMany('categories', relation =>
						relation.target('Category', e => e.column('name', c => c.type(Model.ColumnType.String))),
					),
				)
				.buildSchema(),
			query: GQL`
        query {
          listPost(filter: {categories: {id: {in: ["${testUuid(10)}", "${testUuid(11)}"]}}}) {
            id
          }
        }`,
			executes: [
				...noTransaction([
					{
						sql: SQL`select "root_"."id" as "root_id"
                     from "public"."post" as "root_"
                     where "root_"."id" in (select "junction_"."post_id"
                                            from "public"."post_categories" as "junction_"
                                            where "junction_"."category_id" in (?, ?))`,
						parameters: [testUuid(10), testUuid(11)],
						response: {
							rows: [
								{
									root_id: testUuid(1),
								},
								{
									root_id: testUuid(3),
								},
							],
						},
					},
				]),
			],
			return: {
				data: {
					listPost: [
						{
							id: testUuid(1),
						},
						{
							id: testUuid(3),
						},
					],
				},
			},
		})
	})

	it('Posts with locales query with where (one has many)', async () => {
		await execute({
			schema: new SchemaBuilder()
				.entity('Post', entity =>
					entity.oneHasMany('locales', relation => relation.target('PostLocale').ownedBy('post')),
				)
				.entity('PostLocale', entity =>
					entity
						.column('locale', column => column.type(Model.ColumnType.String))
						.column('title', column => column.type(Model.ColumnType.String)),
				)
				.buildSchema(),
			query: GQL`
        query {
          listPost {
            id
            locales(filter: {locale: {eq: "cs"}}) {
              id
              locale
              title
            }
          }
        }
			`,
			executes: [
				...noTransaction([
					{
						sql: SQL`select
                       "root_"."id" as "root_id",
                       "root_"."id" as "root_id"
                     from "public"."post" as "root_"`,
						response: {
							rows: [{ root_id: testUuid(1) }, { root_id: testUuid(2) }],
						},
					},
					{
						sql: SQL`select
                       "root_"."post_id" as "__grouping_key",
                       "root_"."id" as "root_id",
                       "root_"."locale" as "root_locale",
                       "root_"."title" as "root_title"
                     from "public"."post_locale" as "root_"
                     where "root_"."locale" = ? and "root_"."post_id" in (?, ?)`,
						parameters: ['cs', testUuid(1), testUuid(2)],
						response: {
							rows: [
								{ root_id: testUuid(3), root_locale: 'cs', root_title: 'ahoj svete', __grouping_key: testUuid(1) },
								{ root_id: testUuid(5), root_locale: 'cs', root_title: 'dalsi clanek', __grouping_key: testUuid(2) },
							],
						},
					},
				]),
			],
			return: {
				data: {
					listPost: [
						{
							id: testUuid(1),
							locales: [
								{
									id: testUuid(3),
									locale: 'cs',
									title: 'ahoj svete',
								},
							],
						},
						{
							id: testUuid(2),
							locales: [
								{
									id: testUuid(5),
									locale: 'cs',
									title: 'dalsi clanek',
								},
							],
						},
					],
				},
			},
		})
	})

	it('Post with author filtered by name (where many has one)', async () => {
		await execute({
			schema: new SchemaBuilder()
				.entity('Post', entity => entity.manyHasOne('author', relation => relation.target('Author')))
				.entity('Author', entity => entity.column('name', column => column.type(Model.ColumnType.String)))
				.buildSchema(),
			query: GQL`
        query {
          listPost {
            id
            author (filter: {name: {eq: "John"}}) {
              id
            }
          }
        }`,
			executes: [
				...noTransaction([
					{
						sql: SQL`select
                       "root_"."id" as "root_id",
                       "root_"."author_id" as "root_author"
                     from "public"."post" as "root_"`,
						response: {
							rows: [
								{
									root_id: testUuid(1),
									root_author: testUuid(2),
								},
								{
									root_id: testUuid(3),
									root_author: testUuid(4),
								},
							],
						},
					},
					{
						sql: SQL`select
                       "root_"."id" as "root_id",
                       "root_"."id" as "root_id"
                     from "public"."author" as "root_"
                     where "root_"."id" in (?, ?) and "root_"."name" = ?`,
						parameters: [testUuid(2), testUuid(4), 'John'],
						response: {
							rows: [
								{
									root_id: testUuid(2),
								},
							],
						},
					},
				]),
			],
			return: {
				data: {
					listPost: [
						{
							id: testUuid(1),
							author: {
								id: testUuid(2),
							},
						},
						{
							id: testUuid(3),
							author: null,
						},
					],
				},
			},
		})
	})

	it('Post locale ordered by author name', async () => {
		await execute({
			schema: new SchemaBuilder()
				.entity('PostLocale', entity =>
					entity.manyHasOne('post', r =>
						r.target('Post', e =>
							e.manyHasOne('author', r =>
								r.target('Author', e => e.column('name', c => c.type(Model.ColumnType.String))),
							),
						),
					),
				)
				.buildSchema(),
			query: GQL`
        query {
          listPostLocale(orderBy: [{post: {author: {name: asc}}}, {id: desc}]) {
            id
          }
        }`,
			executes: [
				...noTransaction([
					{
						sql: SQL`select
                       "root_"."id" as "root_id"
                     from "public"."post_locale" as "root_" left join "public"."post" as "root_post" on "root_"."post_id" = "root_post"."id"
                       left join "public"."author" as "root_post_author" on "root_post"."author_id" = "root_post_author"."id"
                     order by "root_post_author"."name" asc, "root_"."id" desc`,
						response: {
							rows: [{ root_id: testUuid(2) }],
						},
					},
				]),
			],
			return: {
				data: {
					listPostLocale: [
						{
							id: testUuid(2),
						},
					],
				},
			},
		})
	})

	it('Post with ordered locales', async () => {
		await execute({
			schema: new SchemaBuilder()
				.entity('PostLocale', entity => entity.manyHasOne('post', r => r.target('Post', e => e).inversedBy('locales')))
				.buildSchema(),
			query: GQL`
        query {
          listPost {
            id
            locales(orderBy: {id: desc}) {
              id
            }
          }
        }`,
			executes: [
				...noTransaction([
					{
						sql: SQL`select
                       "root_"."id" as "root_id",
                       "root_"."id" as "root_id"
                     from "public"."post" as "root_"`,
						response: {
							rows: [{ root_id: testUuid(1) }, { root_id: testUuid(2) }],
						},
					},
					{
						sql: SQL`select
                       "root_"."post_id" as "__grouping_key",
                       "root_"."id" as "root_id"
                     from "public"."post_locale" as "root_"
                     where "root_"."post_id" in (?, ?)
                     order by "root_"."id" desc`,
						parameters: [testUuid(1), testUuid(2)],
						response: {
							rows: [
								{ __grouping_key: testUuid(1), root_id: testUuid(3) },
								{ __grouping_key: testUuid(1), root_id: testUuid(4) },
								{ __grouping_key: testUuid(2), root_id: testUuid(4) },
								{ __grouping_key: testUuid(2), root_id: testUuid(5) },
							],
						},
					},
				]),
			],
			return: {
				data: {
					listPost: [
						{
							id: '123e4567-e89b-12d3-a456-000000000001',
							locales: [
								{
									id: '123e4567-e89b-12d3-a456-000000000003',
								},
								{
									id: '123e4567-e89b-12d3-a456-000000000004',
								},
							],
						},
						{
							id: '123e4567-e89b-12d3-a456-000000000002',
							locales: [
								{
									id: '123e4567-e89b-12d3-a456-000000000004',
								},
								{
									id: '123e4567-e89b-12d3-a456-000000000005',
								},
							],
						},
					],
				},
			},
		})
	})

	it('many has many with where, limit and orderBy', async () => {
		await execute({
			schema: new SchemaBuilder()
				.entity('Post', e =>
					e
						.column('title', c => c.type(Model.ColumnType.String))
						.column('locale', c => c.type(Model.ColumnType.String))
						.manyHasMany('categories', r =>
							r.target('Category', e => e.column('title', c => c.type(Model.ColumnType.String))).inversedBy('posts'),
						),
				)
				.buildSchema(),
			query: GQL`
        query {
          listCategory {
            id
            title
            posts(filter: {locale: {eq: "cs"}}, orderBy: [{title: asc}], offset: 1, limit: 2) {
              id
              title
            }
          }
        }`,
			executes: noTransaction([
				{
					sql: SQL`select
                     "root_"."id" as "root_id",
                     "root_"."title" as "root_title",
                     "root_"."id" as "root_id"
                   from "public"."category" as "root_"`,
					parameters: [],
					response: {
						rows: [
							{ root_id: testUuid(1), root_title: 'Hello' },
							{ root_id: testUuid(2), root_title: 'World' },
						],
					},
				},
				{
					sql: SQL`with "data" as
          (select
             "junction_"."category_id",
             "junction_"."post_id",
             row_number()
             over(partition by "junction_"."category_id"
               order by "root_"."title" asc, "root_"."id" asc) as "rowNumber_"
           from "public"."post_categories" as "junction_" inner join "public"."post" as "root_" on "junction_"."post_id" = "root_"."id"
           where "junction_"."category_id" in (?, ?) and "root_"."locale" = ?
           order by "root_"."title" asc, "root_"."id" asc)
          select
            "data".*
          from "data"
          where
            "data"."rowNumber_" > ? and "data"."rowNumber_" <= ?`,
					parameters: [testUuid(1), testUuid(2), 'cs', 1, 3],
					response: {
						rows: [
							{ category_id: testUuid(1), post_id: testUuid(10) },
							{ category_id: testUuid(1), post_id: testUuid(11) },
							{ category_id: testUuid(2), post_id: testUuid(10) },
							{ category_id: testUuid(2), post_id: testUuid(12) },
						],
					},
				},
				{
					sql: SQL`select
                     "root_"."title" as "root_title",
                     "root_"."id" as "root_id"
                   from "public"."post" as "root_"
                   where "root_"."id" in (?, ?, ?)`,
					parameters: [testUuid(10), testUuid(11), testUuid(12)],
					response: {
						rows: [
							{ root_id: testUuid(12), root_title: 'A' },
							{ root_id: testUuid(11), root_title: 'B' },
							{ root_id: testUuid(10), root_title: 'C' },
						],
					},
				},
			]),
			return: {
				data: {
					listCategory: [
						{
							id: testUuid(1),
							posts: [
								{
									id: testUuid(10),
									title: 'C',
								},
								{
									id: testUuid(11),
									title: 'B',
								},
							],
							title: 'Hello',
						},
						{
							id: testUuid(2),
							posts: [
								{
									id: testUuid(10),
									title: 'C',
								},
								{
									id: testUuid(12),
									title: 'A',
								},
							],
							title: 'World',
						},
					],
				},
			},
		})
	})

	it('one has many with where, limit and orderBy', async () => {
		await execute({
			schema: new SchemaBuilder()
				.entity('Author', e =>
					e
						.column('name', c => c.type(Model.ColumnType.String))
						.oneHasMany('posts', r =>
							r
								.target('Post', e =>
									e
										.column('title', c => c.type(Model.ColumnType.String))
										.column('locale', c => c.type(Model.ColumnType.String)),
								)
								.ownedBy('author'),
						),
				)
				.buildSchema(),
			query: GQL`
        query {
          listAuthor {
            id
            name
            posts(filter: {locale: {eq: "cs"}}, orderBy: [{title: asc}], offset: 1, limit: 2) {
              id
              title
            }
          }
        }`,
			executes: noTransaction([
				{
					sql: SQL`select
                     "root_"."id" as "root_id",
                     "root_"."name" as "root_name",
                     "root_"."id" as "root_id"
                   from "public"."author" as "root_"`,
					parameters: [],
					response: {
						rows: [
							{ root_id: testUuid(1), root_name: 'John' },
							{ root_id: testUuid(2), root_name: 'Jack' },
						],
					},
				},
				{
					sql: SQL`with "data" as
          (select
             "root_"."author_id" as "__grouping_key",
             "root_"."id" as "root_id",
             "root_"."title" as "root_title",
             row_number()
             over(partition by "root_"."author_id"
               order by "root_"."title" asc, "root_"."id" asc) as "rowNumber_"
           from "public"."post" as "root_"
           where "root_"."locale" = ? and "root_"."author_id" in (?, ?)
           order by "root_"."title" asc, "root_"."id" asc)
          select "data".*
          from "data"
          where "data"."rowNumber_" > ? and "data"."rowNumber_" <= ?`,
					parameters: ['cs', testUuid(1), testUuid(2), 1, 3],
					response: {
						rows: [
							{ __grouping_key: testUuid(1), root_id: testUuid(10), root_title: 'A' },
							{ __grouping_key: testUuid(1), root_id: testUuid(11), root_title: 'B' },
							{ __grouping_key: testUuid(2), root_id: testUuid(12), root_title: 'C' },
						],
					},
				},
			]),
			return: {
				data: {
					listAuthor: [
						{
							id: testUuid(1),
							posts: [
								{
									id: testUuid(10),
									title: 'A',
								},
								{
									id: testUuid(11),
									title: 'B',
								},
							],
							name: 'John',
						},
						{
							id: testUuid(2),
							posts: [
								{
									id: testUuid(12),
									title: 'C',
								},
							],
							name: 'Jack',
						},
					],
				},
			},
		})
	})

	it('root limit and order', async () => {
		await execute({
			schema: new SchemaBuilder()
				.entity('Author', e => e.column('name', c => c.type(Model.ColumnType.String)))
				.buildSchema(),
			query: GQL`
        query {
          listAuthor(orderBy: [{name: asc}], offset: 2, limit: 3) {
            id
            name
          }
        }`,
			executes: noTransaction([
				{
					sql: SQL`select
                     "root_"."id" as "root_id",
                     "root_"."name" as "root_name"
                   from "public"."author" as "root_"
                   order by "root_"."name" asc, "root_"."id" asc
                   limit 3
                   offset 2`,
					parameters: [],
					response: {
						rows: [
							{ root_id: testUuid(1), root_name: 'John' },
							{ root_id: testUuid(2), root_name: 'Jack' },
						],
					},
				},
			]),
			return: {
				data: {
					listAuthor: [
						{
							id: testUuid(1),
							name: 'John',
						},
						{
							id: testUuid(2),
							name: 'Jack',
						},
					],
				},
			},
		})
	})

	it('aliases', async () => {
		await execute({
			schema: new SchemaBuilder()
				.entity('Author', e => e.column('name', c => c.type(Model.ColumnType.String)))
				.buildSchema(),
			permissions: {
				Author: {
					predicates: {
						name_eq: {
							name: { eq: 'John' },
						},
					},
					operations: {
						read: {
							id: true,
							name: true,
						},
						update: {
							name: 'name_eq',
						},
					},
				},
			},
			query: GQL`
        query {
          listAuthor {
            idx: id
            name1: name
	          name2: name
	          meta: _meta {
		          name1: name {
		          	readable1: readable
		          	readable2: readable
		          	updatable1: updatable
	          	}
	          }
          }
        }`,
			executes: noTransaction([
				{
					sql: SQL`select
                     "root_"."id" as "root_idx",
                     "root_"."name" as "root_name1",
                     "root_"."name" as "root_name2",
                     true as "root_meta_name1_readable1",
                     true as "root_meta_name1_readable2",
                     "root_"."name" = ? as "root_meta_name1_updatable1",
                     "root_"."id" as "root_id"
                   from "public"."author" as "root_"`,
					parameters: ['John'],
					response: {
						rows: [
							{
								root_id: testUuid(1),
								root_idx: testUuid(1),
								root_name1: 'John',
								root_name2: 'John',
								root_meta_name1_readable1: true,
								root_meta_name1_readable2: true,
								root_meta_name1_updatable1: false,
							},
						],
					},
				},
			]),
			return: {
				data: {
					listAuthor: [
						{
							idx: testUuid(1),
							meta: {
								name1: {
									readable1: true,
									readable2: true,
									updatable1: false,
								},
							},
							name1: 'John',
							name2: 'John',
						},
					],
				},
			},
		})
	})

	it('fragments', async () => {
		await execute({
			schema: new SchemaBuilder()
				.entity('Author', e =>
					e
						.column('name', c => c.type(Model.ColumnType.String))
						.oneHasMany('posts', r => r.target('Post', e => e.column('title', c => c.type(Model.ColumnType.String)))),
				)
				.buildSchema(),
			query: GQL`
				fragment PostData on Post {
					id
					title
				}
        fragment AuthorData on Author {
					id
					name
        }
        fragment AuthorPosts on Author {
	        posts {
		        ...PostData
	        }
        }
				fragment AuthorWithPost on Author {
					...AuthorData
					...AuthorPosts
				}
        query {
          listAuthor {
	          ...AuthorWithPost
          }
        }`,
			executes: noTransaction([
				{
					sql: SQL`select
                     "root_"."id" as "root_id",
                     "root_"."name" as "root_name",
                     "root_"."id" as "root_id"
                   from "public"."author" as "root_"`,
					parameters: [],
					response: {
						rows: [{ root_id: testUuid(1), root_name: 'John' }],
					},
				},
				{
					sql: SQL`select
                     "root_"."author_id" as "__grouping_key",
                     "root_"."id" as "root_id",
                     "root_"."title" as "root_title"
                   from "public"."post" as "root_"
                   where "root_"."author_id" in (?)`,
					parameters: [testUuid(1)],
					response: {
						rows: [],
					},
				},
			]),
			return: {
				data: {
					listAuthor: [
						{
							id: testUuid(1),
							name: 'John',
							posts: [],
						},
					],
				},
			},
		})
	})

	it('reduced has many', async () => {
		await execute({
			schema: new SchemaBuilder()
				.entity('Post', e =>
					e
						.column('publishedAt', c => c.type(Model.ColumnType.DateTime))
						.oneHasMany('locales', r =>
							r.ownedBy('post').target('PostLocale', e =>
								e
									.unique(['locale', 'post'])
									.column('locale', c => c.type(Model.ColumnType.String))
									.column('title', c => c.type(Model.ColumnType.String)),
							),
						),
				)
				.buildSchema(),
			query: GQL`
        query {
          listPost {
	          id
	          localesByLocale(by: {locale: "cs"}) {
		          id
	          }
          }
        }`,
			executes: noTransaction([
				{
					sql: SQL`select
                     "root_"."id" as "root_id",
                     "root_"."id" as "root_id"
                   from "public"."post" as "root_"`,
					parameters: [],
					response: {
						rows: [{ root_id: testUuid(1) }, { root_id: testUuid(2) }],
					},
				},
				{
					sql: SQL`select
                     "root_"."post_id" as "root_post",
                     "root_"."id" as "root_id"
                   from "public"."post_locale" as "root_"
                   where "root_"."locale" = ? and "root_"."post_id" in (?, ?)`,
					parameters: ['cs', testUuid(1), testUuid(2)],
					response: {
						rows: [
							{ root_post: testUuid(1), root_id: testUuid(11) },
							{ root_post: testUuid(2), root_id: testUuid(12) },
						],
					},
				},
			]),
			return: {
				data: {
					listPost: [
						{
							id: testUuid(1),
							localesByLocale: { id: testUuid(11) },
						},
						{
							id: testUuid(2),
							localesByLocale: { id: testUuid(12) },
						},
					],
				},
			},
		})
	})

	it('Format date query', async () => {
		await execute({
			schema: new SchemaBuilder()
				.entity('Post', entity => entity.column('publishedAt', column => column.type(Model.ColumnType.DateTime)))
				.buildSchema(),
			query: GQL`
        query {
          getPost(by: {id: "${testUuid(1)}"}) {
            publishedAt
          }
        }`,
			executes: [
				...noTransaction([
					{
						sql: SQL`select "root_"."published_at" as "root_publishedAt", "root_"."id" as "root_id"
                     from "public"."post" as "root_"
                     where "root_"."id" = ?`,
						response: { rows: [{ root_id: testUuid(1), root_publishedAt: new Date('2019-11-01T05:00:00.000Z') }] },
						parameters: [testUuid(1)],
					},
				]),
			],
			return: {
				data: {
					getPost: {
						publishedAt: '2019-11-01T05:00:00.000Z',
					},
				},
			},
		})
	})

	it('Complex condition', async () => {
		await execute({
			schema: new SchemaBuilder()
				.entity('Post', entity => entity.column('title', column => column.type(Model.ColumnType.String)))
				.buildSchema(),
			query: GQL`
        query {
          listPost(filter: {title: {or: [
	          {or: [{eq: "A"}, {eq: "B"}]},
	          {not: {lt: "X"}},
	          {and: [{isNull: true}, {isNull: false}]}
          ]}}) {
            id
          }
        }
			`,
			executes: [
				...noTransaction([
					{
						sql: SQL`select "root_"."id" as "root_id"
from "public"."post" as "root_"
where (("root_"."title" = ? or "root_"."title" = ?)
      or not("root_"."title" < ?)
      or "root_"."title" is null and not("root_"."title" is null))`,
						parameters: ['A', 'B', 'X'],
						response: { rows: [{ root_id: testUuid(1) }] },
					},
				]),
			],
			return: {
				data: {
					listPost: [
						{
							id: testUuid(1),
						},
					],
				},
			},
		})
	})

	it('one has many - default ordering', async () => {
		await execute({
			schema: new SchemaBuilder()
				.entity('Menu', e =>
					e.oneHasMany('items', r =>
						r
							.ownedBy('menu')
							.orderBy('order')
							.target('MenuItem', e => e.column('heading').column('order', c => c.type(Model.ColumnType.Int))),
					),
				)
				.buildSchema(),
			query: GQL`
        query {
          listMenu {
	          id
	          items {
		          heading
	          }
          }
        }`,
			executes: noTransaction([
				{
					sql: SQL`select "root_"."id" as "root_id", "root_"."id" as "root_id" from  "public"."menu" as "root_"`,
					parameters: [],
					response: {
						rows: [{ root_id: testUuid(1) }, { root_id: testUuid(2) }],
					},
				},
				{
					sql: SQL`select "root_"."menu_id" as "__grouping_key", "root_"."heading" as "root_heading", "root_"."id" as "root_id"
from  "public"."menu_item" as "root_"   where "root_"."menu_id" in (?, ?)
order by "root_"."order" asc, "root_"."id" asc`,
					parameters: [testUuid(1), testUuid(2)],
					response: {
						rows: [
							{ __grouping_key: testUuid(1), root_id: testUuid(11), root_heading: 'a1' },
							{ __grouping_key: testUuid(1), root_id: testUuid(12), root_heading: 'a2' },
							{ __grouping_key: testUuid(2), root_id: testUuid(13), root_heading: 'a3' },
						],
					},
				},
			]),
			return: {
				data: {
					listMenu: [
						{
							id: testUuid(1),
							items: [
								{
									heading: 'a1',
								},
								{
									heading: 'a2',
								},
							],
						},
						{
							id: testUuid(2),
							items: [
								{
									heading: 'a3',
								},
							],
						},
					],
				},
			},
		})
	})

	it('many has many - default ordering', async () => {
		await execute({
			schema: new SchemaBuilder()
				.entity('Post', entity =>
					entity.manyHasMany('categories', relation =>
						relation.target('Category', e => e.column('name', c => c.type(Model.ColumnType.String))).orderBy('name'),
					),
				)
				.buildSchema(),
			query: GQL`
        query {
          listPost {
	          id
	          categories {
		          name
	          }
          }
        }`,
			executes: noTransaction([
				{
					sql: SQL`select "root_"."id" as "root_id", "root_"."id" as "root_id" from  "public"."post" as "root_"`,
					parameters: [],
					response: {
						rows: [{ root_id: testUuid(1) }, { root_id: testUuid(2) }],
					},
				},
				{
					sql: SQL`select "junction_"."category_id", "junction_"."post_id"
from  "public"."post_categories" as "junction_"
inner join "public"."category" as "root_" on "junction_"."category_id" = "root_"."id"
where "junction_"."post_id" in (?, ?)   order by "root_"."name" asc, "root_"."id" asc`,
					parameters: [testUuid(1), testUuid(2)],
					response: {
						rows: [
							{ post_id: testUuid(1), category_id: testUuid(12) },
							{ post_id: testUuid(1), category_id: testUuid(11) },
							{ post_id: testUuid(2), category_id: testUuid(12) },
						],
					},
				},
				{
					sql: SQL`select "root_"."name" as "root_name", "root_"."id" as "root_id"
from  "public"."category" as "root_"   where "root_"."id" in (?, ?)`,
					parameters: [testUuid(12), testUuid(11)],
					response: {
						rows: [
							{ root_id: testUuid(11), root_name: 'A' },
							{ root_id: testUuid(12), root_name: 'B' },
						],
					},
				},
			]),
			return: {
				data: {
					listPost: [
						{
							id: testUuid(1),
							categories: [
								{
									name: 'B',
								},
								{
									name: 'A',
								},
							],
						},
						{
							id: testUuid(2),
							categories: [
								{
									name: 'B',
								},
							],
						},
					],
				},
			},
		})
	})

	it('transactions', async () => {
		await execute({
			schema: new SchemaBuilder()
				.entity('Post', entity => entity.column('title', column => column.type(Model.ColumnType.String)))
				.buildSchema(),
			query: GQL`
        query {
          transaction {
            post1: getPost(by: {id: "${testUuid(1)}"}) {
              id
            }
            posts: listPost {
              id
            }
            postsPaginated: paginatePost {
              pageInfo {
                totalCount
              }
            }
          }
        }`,
			executes: [
				...sqlTransaction([
					{
						sql: SQL`select "root_"."id" as "root_id"
						         from "public"."post" as "root_"
                     where "root_"."id" = ?`,
						response: { rows: [{ root_id: testUuid(1) }] },
						parameters: [testUuid(1)],
					},
					{
						sql: SQL`select "root_"."id" as "root_id"
						         from "public"."post" as "root_"`,
						response: { rows: [{ root_id: testUuid(2) }] },
						parameters: [],
					},
					{
						sql: SQL`select count(*) as "row_count"
from "public"."post" as "root_"`,
						parameters: [],
						response: { rows: [{ row_count: 10 }] },
					},
				]),
			],
			return: {
				data: {
					transaction: {
						post1: {
							id: testUuid(1),
						},
						posts: [
							{
								id: testUuid(2),
							},
						],
						postsPaginated: {
							pageInfo: {
								totalCount: 10,
							},
						},
					},
				},
			},
		})
	})

	it('paginate posts', async () => {
		await execute({
			schema: new SchemaBuilder()
				.entity('Post', entity =>
					entity
						.column('title', column => column.type(Model.ColumnType.String))
						.manyHasOne('author', relation => relation.target('Author')),
				)
				.entity('Author', entity => entity.column('name', column => column.type(Model.ColumnType.String)))
				.buildSchema(),
			query: GQL`
        query {
          paginatePost(skip: 1, first: 2, filter: {author: {name: {eq: "jack"}}}) {
	          pageInfo {
		          totalCount
	          }
	          edges {
		          node {
			          id
			          title
			          author {
				          name
			          }
		          }
	          }
          }
        }`,
			executes: [
				...noTransaction([
					{
						sql: SQL`select count(*) as "row_count"
from "public"."post" as "root_"
    left join "public"."author" as "root_author" on "root_"."author_id" = "root_author"."id"
where "root_author"."name" = ?`,
						parameters: ['jack'],
						response: { rows: [{ row_count: 10 }] },
					},
					{
						sql: SQL`select "root_"."id" as "root_id", "root_"."title" as "root_title", "root_"."author_id" as "root_author"
from "public"."post" as "root_"
    left join "public"."author" as "root_author" on "root_"."author_id" = "root_author"."id"
where "root_author"."name" = ? order by "root_"."id" asc limit 2 offset 1`,
						response: {
							rows: [
								{
									root_id: testUuid(1),
									root_title: 'Foo',
									root_author: testUuid(2),
								},
								{
									root_id: testUuid(3),
									root_title: 'Bar',
									root_author: testUuid(2),
								},
							],
						},
					},
					{
						sql: SQL`
              select
                "root_"."id" as "root_id",
                "root_"."name" as "root_name",
                "root_"."id" as "root_id"
              from "public"."author" as "root_"
              where "root_"."id" in (?)
						`,
						parameters: [testUuid(2)],
						response: {
							rows: [
								{
									root_id: testUuid(2),
									root_name: 'jack',
								},
							],
						},
					},
				]),
			],
			return: {
				data: {
					paginatePost: {
						pageInfo: {
							totalCount: 10,
						},
						edges: [
							{
								node: {
									id: testUuid(1),
									title: 'Foo',
									author: {
										name: 'jack',
									},
								},
							},
							{
								node: {
									id: testUuid(3),
									title: 'Bar',
									author: {
										name: 'jack',
									},
								},
							},
						],
					},
				},
			},
		})
	})
	describe('order by random', () => {
		it('sorts by random', async () => {
			await execute({
				schema: new SchemaBuilder().entity('Post', entity => entity).buildSchema(),
				query: GQL`
        query {
          listPost(orderBy: [{_random: true}]) {
            id
          }
        }`,
				executes: [
					...noTransaction([
						{
							sql: SQL`
								select "root_"."id" as "root_id" from "public"."post" as "root_"
								order by random() asc`,
							response: {
								rows: [
									{
										root_id: testUuid(1),
									},
									{
										root_id: testUuid(3),
									},
								],
							},
						},
					]),
				],
				return: {
					data: {
						listPost: [
							{
								id: testUuid(1),
							},
							{
								id: testUuid(3),
							},
						],
					},
				},
			})
		})

		it('sorts by seeded random', async () => {
			await execute({
				schema: new SchemaBuilder().entity('Post', entity => entity).buildSchema(),
				query: GQL`
        query {
          listPost(orderBy: [{_randomSeeded: 123456}]) {
            id
          }
        }`,
				executes: [
					...noTransaction([
						{
							sql: SQL`
								with "rand_seed" as (select setseed(?))
								select "root_"."id" as "root_id" from "public"."post" as "root_"
									inner join "rand_seed" on true
								order by random() asc`,
							response: {
								rows: [
									{
										root_id: testUuid(1),
									},
									{
										root_id: testUuid(3),
									},
								],
							},
						},
					]),
				],
				return: {
					data: {
						listPost: [
							{
								id: testUuid(1),
							},
							{
								id: testUuid(3),
							},
						],
					},
				},
			})
		})

		it('sorts posts by random on has many relation', async () => {
			await execute({
				schema: new SchemaBuilder()
					.entity('Post', e =>
						e
							.column('title', c => c.type(Model.ColumnType.String))
							.column('locale', c => c.type(Model.ColumnType.String))
							.manyHasMany('categories', r =>
								r.target('Category', e => e.column('title', c => c.type(Model.ColumnType.String))).inversedBy('posts'),
							),
					)
					.buildSchema(),
				query: GQL`
        query {
          listCategory {
            id
            title
            posts(orderBy: [{_randomSeeded: 4555}], limit: 1) {
              id
              title
            }
          }
        }`,
				executes: noTransaction([
					{
						sql: SQL`select
                     "root_"."id" as "root_id",
                     "root_"."title" as "root_title",
                     "root_"."id" as "root_id"
                   from "public"."category" as "root_"`,
						parameters: [],
						response: {
							rows: [
								{ root_id: testUuid(1), root_title: 'Hello' },
								{ root_id: testUuid(2), root_title: 'World' },
							],
						},
					},
					{
						sql: SQL`
							with "data" as
								(with "rand_seed" as
									(select setseed(?))
								select "junction_"."category_id",
									"junction_"."post_id",
									row_number() over(partition by "junction_"."category_id" order by random() asc) as "rownumber_"
								from "public"."post_categories" as "junction_"
									inner join "rand_seed" on true
								where "junction_"."category_id" in (?, ?)
								order by random() asc)
							select "data".* from "data" where "data"."rownumber_" <= ?`,
						parameters: [4555 / Math.pow(2, 31), testUuid(1), testUuid(2), 1],
						response: {
							rows: [
								{ category_id: testUuid(1), post_id: testUuid(10) },
								{ category_id: testUuid(1), post_id: testUuid(11) },
								{ category_id: testUuid(2), post_id: testUuid(10) },
								{ category_id: testUuid(2), post_id: testUuid(12) },
							],
						},
					},
					{
						sql: SQL`select
                     "root_"."title" as "root_title",
                     "root_"."id" as "root_id"
                   from "public"."post" as "root_"
                   where "root_"."id" in (?, ?, ?)`,
						parameters: [testUuid(10), testUuid(11), testUuid(12)],
						response: {
							rows: [
								{ root_id: testUuid(12), root_title: 'A' },
								{ root_id: testUuid(11), root_title: 'B' },
								{ root_id: testUuid(10), root_title: 'C' },
							],
						},
					},
				]),
				return: {
					data: {
						listCategory: [
							{
								id: testUuid(1),
								posts: [
									{
										id: testUuid(10),
										title: 'C',
									},
									{
										id: testUuid(11),
										title: 'B',
									},
								],
								title: 'Hello',
							},
							{
								id: testUuid(2),
								posts: [
									{
										id: testUuid(10),
										title: 'C',
									},
									{
										id: testUuid(12),
										title: 'A',
									},
								],
								title: 'World',
							},
						],
					},
				},
			})
		})

		it('hashes an alias when too long', async () => {
			await execute({
				schema: new SchemaBuilder()
					.entity('Category', e =>
						e.column('title', c => c.type(Model.ColumnType.String)).manyHasOne('parent', r => r.target('Category')),
					)
					.buildSchema(),
				query: GQL`
        query {
          listCategory(filter: {or: [
	          {parent: {parent: {parent: {parent: {parent: {parent: {parent: {parent: {parent: {parent: {title: {eq: "Hello"}}}}}}}}}}}},
	          {parent: {parent: {parent: {parent: {parent: {parent: {parent: {parent: {parent: {title: {eq: "Hello"}}}}}}}}}}},
          ]}) {
            id
            title
          }
        }`,
				executes: noTransaction([
					{
						sql: SQL`SELECT "root_"."id" AS "root_id", "root_"."title" AS "root_title"
						         FROM "public"."category" AS "root_"
							              LEFT JOIN "public"."category" AS "root_parent" ON "root_"."parent_id" = "root_parent"."id"
							              LEFT JOIN "public"."category" AS "root_parent_parent" ON "root_parent"."parent_id" = "root_parent_parent"."id"
							              LEFT JOIN "public"."category" AS "root_parent_parent_parent"
						         ON "root_parent_parent"."parent_id" = "root_parent_parent_parent"."id"
							              LEFT JOIN "public"."category" AS "root_parent_parent_parent_parent"
						         ON "root_parent_parent_parent"."parent_id" = "root_parent_parent_parent_parent"."id"
							              LEFT JOIN "public"."category" AS "root_parent_parent_parent_parent_parent"
						         ON "root_parent_parent_parent_parent"."parent_id" = "root_parent_parent_parent_parent_parent"."id"
							              LEFT JOIN "public"."category" AS "root_parent_parent_parent_parent_parent_parent"
						         ON "root_parent_parent_parent_parent_parent"."parent_id" = "root_parent_parent_parent_parent_parent_parent"."id"
							              LEFT JOIN "public"."category" AS "root_parent_parent_parent_parent_parent_parent_parent"
						         ON "root_parent_parent_parent_parent_parent_parent"."parent_id" = "root_parent_parent_parent_parent_parent_parent_parent"."id"
							              LEFT JOIN "public"."category" AS "root_parent_parent_parent_parent_parent_parent_parent_parent"
						         ON "root_parent_parent_parent_parent_parent_parent_parent"."parent_id" =
						            "root_parent_parent_parent_parent_parent_parent_parent_parent"."id"
							              LEFT JOIN "public"."category" AS "root_parent_parent_parent_parent_parent_parent_parent__4b415272"
						         ON "root_parent_parent_parent_parent_parent_parent_parent_parent"."parent_id" =
						            "root_parent_parent_parent_parent_parent_parent_parent__4b415272"."id"
							              LEFT JOIN "public"."category" AS "root_parent_parent_parent_parent_parent_parent_parent__7f096906"
						         ON "root_parent_parent_parent_parent_parent_parent_parent__4b415272"."parent_id" =
						            "root_parent_parent_parent_parent_parent_parent_parent__7f096906"."id"
						         WHERE ("root_parent_parent_parent_parent_parent_parent_parent__7f096906"."title" = ? OR
						                "root_parent_parent_parent_parent_parent_parent_parent__4b415272"."title" = ?)`,
						parameters: ['Hello', 'Hello'],
						response: {
							rows: [{ root_id: testUuid(1), root_title: 'Hello' }],
						},
					},
				]),
				return: {
					data: {
						listCategory: [
							{
								id: testUuid(1),
								title: 'Hello',
							},
						],
					},
				},
			})
		})
	})

	it('Categories with children filtered by back-referenced parent', async () => {
		await execute({
			schema: new SchemaBuilder()
				.entity('Category', entity =>
					entity.manyHasOne('parent', r => r.inversedBy('children').target('Category')).column('name'),
				)
				.buildSchema(),
			query: GQL`
        query {
          listCategory {
            id
            children(filter: {parent: {name: {eq: "foo"}}}) {
                id
            }
          }
        }`,
			executes: [
				...noTransaction([
					{
						sql: SQL`select
                       "root_"."id" as "root_id",
                       "root_"."id" as "root_id"
                     from "public"."category" as "root_"`,
						response: {
							rows: [
								{
									root_id: testUuid(1),
								},
								{
									root_id: testUuid(2),
								},
							],
						},
					},
					{
						sql: SQL`select "root_"."parent_id" as "__grouping_key", "root_"."id" as "root_id"
							from "public"."category" as "root_"
							left join "public"."category" as "root_parent" on "root_"."parent_id" = "root_parent"."id"
							where "root_parent"."name" = ? and "root_parent"."id" in (?, ?)`,
						response: {
							rows: [
								{
									__grouping_key: testUuid(1),
									root_id: testUuid(10),
								},
								{
									__grouping_key: testUuid(1),
									root_id: testUuid(11),
								},
							],
						},
					},
				]),
			],
			return: {
				data: {
					listCategory: [
						{
							id: testUuid(1),
							children: [
								{
									id: testUuid(10),
								},
								{
									id: testUuid(11),
								},
							],
						},
						{
							id: testUuid(2),
							children: [],
						},
					],
				},
			},
		})
	})
})
