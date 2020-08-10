import { Model, Validation } from '@contember/schema'
import { execute, failedTransaction, sqlTransaction } from '../../../src/test'
import { GQL, SQL } from '../../../src/tags'
import { testUuid } from '../../../src/testUuid'
import { SchemaBuilder, InputValidation as v } from '@contember/schema-definition'
import 'jasmine'

describe('Insert mutation', () => {
	it('insert author (no relations)', async () => {
		await execute({
			schema: new SchemaBuilder()
				.entity('Author', entity => entity.column('name', c => c.type(Model.ColumnType.String)))
				.buildSchema(),
			query: GQL`
          mutation {
              createAuthor(data: {name: "John"}) {
                  node {
                      id
                  }
              }
          }`,
			executes: [
				...sqlTransaction([
					{
						sql: SQL`with "root_" as
						(select ? :: uuid as "id", ? :: text as "name")
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
                     where "root_"."id" = ?`,
						response: {
							rows: [{ root_id: testUuid(1) }],
						},
						parameters: [testUuid(1)],
					},
				]),
			],
			return: {
				data: {
					createAuthor: {
						node: {
							id: testUuid(1),
						},
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
		          node {
				          id
		          }
          }
        }`,
			executes: [
				...sqlTransaction([
					{
						sql: SQL`with "root_" as
						(select ? :: uuid as "id", ? :: text as "name")
						insert into "public"."author" ("id", "name")
						select "root_"."id", "root_"."name"
            from "root_"
						where "root_"."name" in (?, ?)
						returning "id"`,
						parameters: [testUuid(1), 'John', 'John', 'Jack'],
						response: { rows: [{ id: testUuid(1) }] },
					},
					{
						sql: SQL`select "root_"."id" as "root_id"
                     from "public"."author" as "root_"
                     where "root_"."id" = ?`,
						response: {
							rows: [{ root_id: testUuid(1) }],
						},
						parameters: [testUuid(1)],
					},
				]),
			],
			return: {
				data: {
					createAuthor: {
						node: {
							id: testUuid(1),
						},
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
						.oneHasOne('setting', r => r.target('SiteSetting').inversedBy('site')),
				)
				.entity('SiteSetting', e => e.column('url', c => c.type(Model.ColumnType.String)))
				.buildSchema(),
			query: GQL`
        mutation {
          createSite(data: {name: "Mangoweb", setting: {create: {url: "https://mangoweb.cz"}}}) {
		          node {
				          id
		          }
          }
        }`,
			executes: [
				...sqlTransaction([
					{
						sql: SQL`with "root_" as
						(select ? :: uuid as "id", ? :: text as "url")
						insert into "public"."site_setting" ("id", "url")
						select "root_"."id", "root_"."url"
            from "root_"
						returning "id"`,
						parameters: [testUuid(2), 'https://mangoweb.cz'],
						response: { rows: [{ id: testUuid(2) }] },
					},
					{
						sql: SQL`with "root_" as
						(select ? :: uuid as "id", ? :: text as "name", ? :: uuid as "setting_id")
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
                     where "root_"."id" = ?`,
						response: {
							rows: [{ root_id: testUuid(1) }],
						},
						parameters: [testUuid(1)],
					},
				]),
			],
			return: {
				data: {
					createSite: {
						node: {
							id: testUuid(1),
						},
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
						.oneHasOne('setting', r => r.target('SiteSetting').inversedBy('site')),
				)
				.entity('SiteSetting', e => e.column('url', c => c.type(Model.ColumnType.String)))
				.buildSchema(),
			query: GQL`
        mutation {
          createSiteSetting(data: {url: "https://mangoweb.cz", site: {create: {name: "Mangoweb"}}}) {
		          node {
				          id
		          }
          }
        }`,
			executes: [
				...sqlTransaction([
					{
						sql: SQL`with "root_" as
						(select ? :: uuid as "id", ? :: text as "url")
						insert into "public"."site_setting" ("id", "url")
						select "root_"."id", "root_"."url"
            from "root_"
						returning "id"`,
						parameters: [testUuid(1), 'https://mangoweb.cz'],
						response: { rows: [{ id: testUuid(1) }] },
					},
					{
						sql: SQL`with "root_" as
						(select ? :: uuid as "id", ? :: text as "name", ? :: uuid as "setting_id")
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
                     where "root_"."id" = ?`,
						response: {
							rows: [{ root_id: testUuid(1) }],
						},
						parameters: [testUuid(1)],
					},
				]),
			],
			return: {
				data: {
					createSiteSetting: {
						node: {
							id: testUuid(1),
						},
					},
				},
			},
		})
	})

	it('insert posts with author (many has one)', async () => {
		await execute({
			schema: new SchemaBuilder()
				.entity('Post', e =>
					e.column('publishedAt', c => c.type(Model.ColumnType.DateTime)).manyHasOne('author', r => r.target('Author')),
				)
				.entity('Author', e => e.column('name', c => c.type(Model.ColumnType.String)))
				.buildSchema(),
			query: GQL`
        mutation {
          createPost(data: {
            publishedAt: "2018-06-11",
            author: {create: {name: "John"}}
          }) {
		          node {
				          id
		          }
          }
        }
      `,
			executes: [
				...sqlTransaction([
					{
						sql: SQL`with "root_" as
						(select ? :: uuid as "id", ? :: text as "name")
						insert into "public"."author" ("id", "name")
						select "root_"."id", "root_"."name"
            from "root_"
						returning "id"`,
						parameters: [testUuid(2), 'John'],
						response: { rows: [{ id: testUuid(2) }] },
					},
					{
						sql: SQL`with "root_" as
						(select ? :: uuid as "id", ? :: timestamptz as "published_at", ? :: uuid as "author_id")
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
                     where "root_"."id" = ?`,
						response: {
							rows: [{ root_id: testUuid(1) }],
						},
						parameters: [testUuid(1)],
					},
				]),
			],
			return: {
				data: {
					createPost: {
						node: {
							id: testUuid(1),
						},
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
						.oneHasMany('locales', r => r.target('PostLocale')),
				)
				.entity('PostLocale', e =>
					e
						.column('locale', c => c.type(Model.ColumnType.Enum, { enumName: 'locale' }))
						.column('title', c => c.type(Model.ColumnType.String)),
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
		          node {
				          id
		          }
          }
        }
      `,
			executes: [
				...sqlTransaction([
					{
						sql: SQL`with "root_" as
						(select ? :: uuid as "id", ? :: timestamptz as "published_at")
						insert into "public"."post" ("id", "published_at")
						select "root_"."id", "root_"."published_at"
            from "root_"
						returning "id"`,
						parameters: [testUuid(1), '2018-06-11'],
						response: { rows: [{ id: testUuid(1) }] },
					},
					{
						sql: SQL`with "root_" as
						(select ? :: uuid as "post_id", ? :: uuid as "id", ? :: text as "locale", ? :: text as "title")
						insert into "public"."post_locale" ("post_id", "id", "locale", "title")
						select "root_"."post_id", "root_"."id", "root_"."locale", "root_"."title"
            from "root_"
						returning "id"`,
						parameters: [testUuid(1), testUuid(2), 'cs', 'Ahoj svete'],
						response: { rows: [{ id: testUuid(2) }] },
					},
					{
						sql: SQL`with "root_" as
						(select ? :: uuid as "post_id", ? :: uuid as "id", ? :: text as "locale", ? :: text as "title")
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
                     where "root_"."id" = ?`,
						response: {
							rows: [{ root_id: testUuid(1) }],
						},
						parameters: [testUuid(1)],
					},
				]),
			],
			return: {
				data: {
					createPost: {
						node: {
							id: testUuid(1),
						},
					},
				},
			},
		})
	})

	it('insert post with categories (many has many, owning)', async () => {
		await execute({
			schema: new SchemaBuilder()
				.entity('Post', e =>
					e.column('name', c => c.type(Model.ColumnType.String)).manyHasMany('categories', r => r.target('Category')),
				)
				.entity('Category', e => e.column('name', c => c.type(Model.ColumnType.String)))
				.buildSchema(),
			query: GQL`
          mutation {
              createPost(data: {name: "Hello world", categories: [{create: {name: "Category 1"}}, {create: {name: "Category 2"}}]}) {
                  node {
                      id
                  }
              }
          }
			`,
			executes: [
				...sqlTransaction([
					{
						sql: SQL`with "root_" as
						(select ? :: uuid as "id", ? :: text as "name")
						insert into "public"."post" ("id", "name")
						select "root_"."id", "root_"."name"
            from "root_"
						returning "id"`,
						parameters: [testUuid(1), 'Hello world'],
						response: { rows: [{ id: testUuid(1) }] },
					},
					{
						sql: SQL`with "root_" as
						(select ? :: uuid as "id", ? :: text as "name")
						insert into "public"."category" ("id", "name")
						select "root_"."id", "root_"."name"
            from "root_"
						returning "id"`,
						parameters: [testUuid(2), 'Category 1'],
						response: { rows: [{ id: testUuid(2) }] },
					},
					{
						sql: SQL`insert into "public"."post_categories" ("post_id", "category_id")
          values (?, ?)
          on conflict do nothing`,
						parameters: [testUuid(1), testUuid(2)],
						response: 1,
					},
					{
						sql: SQL`with "root_" as
						(select ? :: uuid as "id", ? :: text as "name")
						insert into "public"."category" ("id", "name")
						select "root_"."id", "root_"."name"
            from "root_"
						returning "id"`,
						parameters: [testUuid(3), 'Category 2'],
						response: { rows: [{ id: testUuid(3) }] },
					},
					{
						sql: SQL`insert into "public"."post_categories" ("post_id", "category_id")
          values (?, ?)
          on conflict do nothing`,
						parameters: [testUuid(1), testUuid(3)],
						response: 1,
					},
					{
						sql: SQL`select "root_"."id" as "root_id"
                     from "public"."post" as "root_"
                     where "root_"."id" = ?`,
						response: {
							rows: [{ root_id: testUuid(1) }],
						},
						parameters: [testUuid(1)],
					},
				]),
			],
			return: {
				data: {
					createPost: {
						node: {
							id: testUuid(1),
						},
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
						.manyHasMany('categories', r => r.target('Category').inversedBy('posts')),
				)
				.entity('Category', e => e.column('name', c => c.type(Model.ColumnType.String)))
				.buildSchema(),
			query: GQL`
        mutation {
          createCategory(data: {name: "Hello world", posts: [{create: {name: "Post 1"}}, {create: {name: "Post 2"}}]}) {
		          node {
                    id
		          }
          }
        }
      `,
			executes: [
				...sqlTransaction([
					{
						sql: SQL`with "root_" as
						(select ? :: uuid as "id", ? :: text as "name")
						insert into "public"."category" ("id", "name")
						select "root_"."id", "root_"."name"
            from "root_"
						returning "id"`,
						parameters: [testUuid(1), 'Hello world'],
						response: { rows: [{ id: testUuid(1) }] },
					},
					{
						sql: SQL`with "root_" as
						(select ? :: uuid as "id", ? :: text as "name")
						insert into "public"."post" ("id", "name")
						select "root_"."id", "root_"."name"
            from "root_"
						returning "id"`,
						parameters: [testUuid(2), 'Post 1'],
						response: { rows: [{ id: testUuid(2) }] },
					},
					{
						sql: SQL`insert into "public"."post_categories" ("post_id", "category_id")
          values (?, ?)
          on conflict do nothing`,
						parameters: [testUuid(2), testUuid(1)],
						response: 1,
					},
					{
						sql: SQL`with "root_" as
						(select ? :: uuid as "id", ? :: text as "name")
						insert into "public"."post" ("id", "name")
						select "root_"."id", "root_"."name"
            from "root_"
						returning "id"`,
						parameters: [testUuid(3), 'Post 2'],
						response: { rows: [{ id: testUuid(3) }] },
					},
					{
						sql: SQL`insert into "public"."post_categories" ("post_id", "category_id")
          values (?, ?)
          on conflict do nothing`,
						parameters: [testUuid(3), testUuid(1)],
						response: 1,
					},
					{
						sql: SQL`select "root_"."id" as "root_id"
                     from "public"."category" as "root_"
                     where "root_"."id" = ?`,
						response: {
							rows: [{ root_id: testUuid(1) }],
						},
						parameters: [testUuid(1)],
					},
				]),
			],
			return: {
				data: {
					createCategory: {
						node: {
							id: testUuid(1),
						},
					},
				},
			},
		})
	})

	describe('acl', () => {
		it('update name', async () => {
			await execute({
				schema: new SchemaBuilder()
					.entity('Author', e => e.column('name', c => c.type(Model.ColumnType.String)))
					.buildSchema(),
				query: GQL`mutation {
					createAuthor(
						data: {name: "John"}
					) {
						ok
					}
				}`,
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
				executes: [
					...sqlTransaction([
						{
							sql: SQL`with "root_" as (select ? :: uuid as "id", ? :: text as "name")
insert into "public"."author" ("id", "name")
select "root_"."id", "root_"."name" from "root_" where "root_"."name" in (?, ?) returning "id"`,
							parameters: [testUuid(1), 'John', 'John', 'Jack'],
							response: { rows: [{ id: testUuid(1) }] },
						},
					]),
				],
				return: {
					data: {
						createAuthor: {
							ok: true,
						},
					},
				},
			})
		})

		it('update name - denied', async () => {
			await execute({
				schema: new SchemaBuilder()
					.entity('Author', e => e.column('name', c => c.type(Model.ColumnType.String)))
					.buildSchema(),
				query: GQL`mutation {
        createAuthor(
            data: {name: "Joe"}
          ) {
          ok
          errors {
            type
          }
        }
      }`,
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
				executes: [
					...failedTransaction([
						{
							sql: SQL`with "root_" as (select ? :: uuid as "id", ? :: text as "name")
insert into "public"."author" ("id", "name")
select "root_"."id", "root_"."name" from "root_" where "root_"."name" in (?, ?) returning "id"`,
							parameters: [testUuid(1), 'Joe', 'John', 'Jack'],
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
	})

	const bookSchema = new SchemaBuilder()
		.entity('Book', entity =>
			entity.column('name', c => c.type(Model.ColumnType.String)).oneHasMany('tags', r => r.target('Tag')),
		)
		.entity('Tag', e => e.column('label'))
		.buildSchema()

	const bookValidation: Validation.Schema = {
		Book: {
			name: v.assert(v.rules.notEmpty(), 'Book name is required').buildRules(),
			tags: v
				.assert(v.rules.notEmpty(), 'You have to fill tags')
				.assert(v.rules.minLength(2), 'You have to fill at least two tags')
				.buildRules(),
		},
		Tag: {
			label: v.assert(v.rules.notEmpty(), 'Tag label is required').buildRules(),
		},
	}

	it('insert book with validation - failed', async () => {
		// fixme
		return

		await execute({
			schema: bookSchema,
			validation: bookValidation,
			query: GQL`
          mutation {
              createBook(data: {}) {
                  ok
                  validation {
                      valid
                      errors {
                          message {
                              text
                          }
                          path {
                              ... on _IndexPathFragment {
                                  index
                              }
                              ... on _FieldPathFragment {
                                  field
                              }
                          }
                      }
                  }
                  node {
                      id
                  }
              }
          }`,
			executes: [...sqlTransaction([])],
			return: {
				data: {
					createBook: {
						node: null,
						ok: false,
						validation: {
							errors: [
								{
									message: {
										text: 'Book name is required',
									},
									path: [
										{
											field: 'name',
										},
									],
								},
								{
									message: {
										text: 'You have to fill tags',
									},
									path: [
										{
											field: 'tags',
										},
									],
								},
							],
							valid: false,
						},
					},
				},
			},
		})
	})

	it('insert book with validation - ok', async () => {
		// fixme
		return

		await execute({
			schema: bookSchema,
			validation: bookValidation,
			query: GQL`
          mutation {
              createBook(data: {name: "John", tags: [{create: {label: "abcd"}}, {create: {label: "xyz"}}]}) {
                  ok
                  node {
                      id
                  }
              }
          }`,
			executes: [
				...sqlTransaction([
					{
						sql: `with "root_" as (select ? :: uuid as "id", ? :: text as "name")
						insert into  "public"."book" ("id", "name") select "root_"."id", "root_"."name" from  "root_"   returning "id"`,
						parameters: [testUuid(1), 'John'],
						response: {
							rows: [{ id: testUuid(1) }],
						},
					},
					{
						sql: `with "root_" as (select ? :: uuid as "book_id", ? :: uuid as "id", ? :: text as "label")
						insert into  "public"."tag" ("book_id", "id", "label") select "root_"."book_id", "root_"."id", "root_"."label" from  "root_"   returning "id"`,
						parameters: [testUuid(1), testUuid(2), 'abcd'],
						response: {
							rows: [{ id: testUuid(2) }],
						},
					},
					{
						sql: `with "root_" as (select ? :: uuid as "book_id", ? :: uuid as "id", ? :: text as "label")
						insert into  "public"."tag" ("book_id", "id", "label") select "root_"."book_id", "root_"."id", "root_"."label" from  "root_"   returning "id"`,
						parameters: [testUuid(1), testUuid(3), 'xyz'],
						response: {
							rows: [{ id: testUuid(3) }],
						},
					},
					{
						sql: `select "root_"."id" as "root_id" from  "public"."book" as "root_"   where "root_"."id" = ?`,
						parameters: [testUuid(1)],
						response: {
							rows: [{ root_id: testUuid(1) }],
						},
					},
				]),
			],
			return: {
				data: {
					createBook: {
						ok: true,
						node: {
							id: testUuid(1),
						},
					},
				},
			},
		})
	})
})
