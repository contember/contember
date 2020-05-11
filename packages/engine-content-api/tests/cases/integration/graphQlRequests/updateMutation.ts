import { execute, failedTransaction, sqlTransaction } from '../../../src/test'
import { Model, Validation } from '@contember/schema'
import { SchemaBuilder, InputValidation as v } from '@contember/schema-definition'
import { GQL, SQL } from '../../../src/tags'
import { testUuid } from '../../../src/testUuid'
import 'jasmine'

describe('update', () => {
	const selectUpdatePostSql = {
		sql: SQL`select "root_"."id" as "root_id"
               from "public"."post" as "root_"
               where "root_"."id" = ?`,
		response: {
			rows: [{ root_id: testUuid(2) }],
		},
		parameters: [testUuid(2)],
	}

	describe('columns (author)', () => {
		it('update name', async () => {
			await execute({
				schema: new SchemaBuilder()
					.entity('Author', e => e.column('name', c => c.type(Model.ColumnType.String)))
					.buildSchema(),
				query: GQL`mutation {
        updateAuthor(
            by: {id: "${testUuid(1)}"},
            data: {name: "John"}
          ) {
          ok
          author: node {
            id
          }
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
							sql: SQL`with "newData_" as (select
                  ? :: text as "name",
                  "root_"."id"
                from "public"."author" as "root_"
                where "root_"."id" = ?) update "public"."author"
              set "name" = "newData_"."name" from "newData_"
              where "author"."id" = "newData_"."id"`,
							parameters: ['John', testUuid(1)],
							response: { rowCount: 1 },
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
						updateAuthor: {
							ok: true,
							author: {
								id: testUuid(1),
							},
						},
					},
				},
			})
		})
	})

	describe('many has one post and author', () => {
		const postWithAuthor = new SchemaBuilder()
			.entity('Post', e =>
				e
					.manyHasOne('author', r =>
						r
							.target('Author')
							.notNull()
							.inversedBy('posts'),
					)
					.column('title', c => c.type(Model.ColumnType.String)),
			)
			.entity('Author', e => e.column('name', c => c.type(Model.ColumnType.String)))
			.buildSchema()

		const postWithNullableAuthor = new SchemaBuilder()
			.entity('Post', e => e.manyHasOne('author', r => r.target('Author').inversedBy('posts')))
			.entity('Author', e => e.column('name', c => c.type(Model.ColumnType.String)))
			.buildSchema()

		it('create', async () => {
			await execute({
				schema: postWithAuthor,
				query: GQL`mutation {
        updatePost(
            by: {id: "${testUuid(2)}"},
            data: {author: {create: {name: "John"}}}
          ) {
          ok
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(2)],
							response: { rows: [{ id: testUuid(2) }] },
						},
						// {
						// 	sql: SQL`select "root_"."author_id" as "root_author", "root_"."id" as "root_id" from "public"."post" as "root_" where "root_"."id" = ?`,
						// 	parameters: [testUuid(2)],
						// 	response: { rows: [{ root_id: testUuid(2), root_author: null }] },
						// },
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
							sql: SQL`with "newData_" as
              (select
                 ? :: uuid as "author_id",
                 "root_"."id",
                 "root_"."title"
               from "public"."post" as "root_"
               where "root_"."id" = ?) update "public"."post"
              set "author_id" = "newData_"."author_id" from "newData_"
              where "post"."id" = "newData_"."id"`,
							parameters: [testUuid(1), testUuid(2)],
							response: { rowCount: 1 },
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

		it('connect', async () => {
			await execute({
				schema: postWithAuthor,
				query: GQL`mutation {
        updatePost(
            by: {id: "${testUuid(2)}"},
            data: {author: {connect: {id: "${testUuid(1)}"}}}
          ) {
          ok
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(2)],
							response: { rows: [{ id: testUuid(2) }] },
						},
						{
							sql: SQL`select "root_"."id" from "public"."author" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(1)],
							response: { rows: [{ id: testUuid(1) }] },
						},
						{
							sql: SQL`with "newData_" as
              (select
                 ? :: uuid as "author_id",
                 "root_"."id",
                 "root_"."title"
               from "public"."post" as "root_"
               where "root_"."id" = ?) update "public"."post"
              set "author_id" = "newData_"."author_id" from "newData_"
              where "post"."id" = "newData_"."id"`,
							parameters: [testUuid(1), testUuid(2)],
							response: { rowCount: 1 },
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

		it('update', async () => {
			await execute({
				schema: postWithAuthor,
				query: GQL`mutation {
        updatePost(
            by: {id: "${testUuid(2)}"},
            data: {author: {update: {name: "John"}}}
          ) {
          ok
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(2)],
							response: { rows: [{ id: testUuid(2) }] },
						},
						{
							sql: SQL`select "root_"."author_id"
                       from "public"."post" as "root_"
                       where "root_"."id" = ?`,
							parameters: [testUuid(2)],
							response: {
								rows: [{ author_id: testUuid(1) }],
							},
						},
						{
							sql: SQL`select "root_"."id" from "public"."author" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(1)],
							response: { rows: [{ id: testUuid(1) }] },
						},
						{
							sql: SQL`with "newData_" as
              (select
                 ? :: text as "name",
                 "root_"."id"
               from "public"."author" as "root_"
               where "root_"."id" = ?) update "public"."author"
              set "name" = "newData_"."name" from "newData_"
              where "author"."id" = "newData_"."id"`,
							parameters: ['John', testUuid(1)],
							response: { rowCount: 1 },
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

		it('upsert - exists', async () => {
			await execute({
				schema: postWithAuthor,
				query: GQL`mutation {
        updatePost(
            by: {id: "${testUuid(2)}"},
            data: {author: {upsert: {create: {name: "John"}, update: {name: "Jack"}}}}
          ) {
          ok
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(2)],
							response: { rows: [{ id: testUuid(2) }] },
						},
						{
							sql: SQL`select "root_"."author_id"
                       from "public"."post" as "root_"
                       where "root_"."id" = ?`,
							parameters: [testUuid(2)],
							response: {
								rows: [{ author_id: testUuid(1) }],
							},
						},
						{
							sql: SQL`select "root_"."id" from "public"."author" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(1)],
							response: { rows: [{ id: testUuid(1) }] },
						},
						{
							sql: SQL`with "newData_" as (select
                                             ? :: text as "name",
                                             "root_"."id"
                                           from "public"."author" as "root_"
                                           where "root_"."id" = ?) update "public"."author"
              set "name" = "newData_"."name" from "newData_"
              where "author"."id" = "newData_"."id"`,
							parameters: ['Jack', testUuid(1)],
							response: { rowCount: 1 },
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

		it('upsert - not exists', async () => {
			await execute({
				schema: postWithAuthor,
				query: GQL`mutation {
        updatePost(
            by: {id: "${testUuid(2)}"},
            data: {author: {upsert: {create: {name: "John"}, update: {name: "Jack"}}}}
          ) {
          ok
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(2)],
							response: { rows: [{ id: testUuid(2) }] },
						},
						{
							sql: SQL`select "root_"."author_id"
                       from "public"."post" as "root_"
                       where "root_"."id" = ?`,
							parameters: [testUuid(2)],
							response: {
								rows: [],
							},
						},
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
							sql: SQL`with "newData_" as
              (select
                 ? :: uuid as "author_id",
                 "root_"."id",
                 "root_"."title"
               from "public"."post" as "root_"
               where "root_"."id" = ?) update "public"."post"
              set "author_id" = "newData_"."author_id" from "newData_"
             where "post"."id" = "newData_"."id"`,
							parameters: [testUuid(1), testUuid(2)],
							response: { rowCount: 1 },
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

		it('disconnect', async () => {
			await execute({
				schema: postWithNullableAuthor,
				query: GQL`mutation {
        updatePost(
            by: {id: "${testUuid(2)}"},
            data: {author: {disconnect: true}}
          ) {
          ok
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(2)],
							response: { rows: [{ id: testUuid(2) }] },
						},
						{
							sql: SQL`with "newData_" as
              (select
                 ? :: uuid as "author_id",
                 "root_"."id"
               from "public"."post" as "root_"
               where "root_"."id" = ?) update "public"."post"
              set "author_id" = "newData_"."author_id" from "newData_"
             where "post"."id" = "newData_"."id"`,
							parameters: [null, testUuid(2)],
							response: { rowCount: 1 },
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

		it('delete', async () => {
			await execute({
				schema: postWithNullableAuthor,
				query: GQL`mutation {
        updatePost(
            by: {id: "${testUuid(2)}"},
            data: {author: {delete: true}}
          ) {
          ok
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(2)],
							response: { rows: [{ id: testUuid(2) }] },
						},
						{
							sql: SQL`select "root_"."author_id"
                       from "public"."post" as "root_"
                       where "root_"."id" = ?`,
							parameters: [testUuid(2)],
							response: {
								rows: [{ author_id: testUuid(1) }],
							},
						},

						{
							sql: SQL`with "newData_" as
              (select
                 ? :: uuid as "author_id",
                 "root_"."id"
               from "public"."post" as "root_"
               where "root_"."id" = ?) update "public"."post"
              set "author_id" = "newData_"."author_id" from "newData_"
             where "post"."id" = "newData_"."id"`,
							parameters: [null, testUuid(2)],
							response: { rowCount: 1 },
						},
						{
							sql: SQL`SET CONSTRAINTS ALL DEFERRED`,
							parameters: [],
							response: 1,
						},
						{
							sql: SQL`select "root_"."id" from "public"."author" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(1)],
							response: { rows: [{ id: testUuid(1) }] },
						},
						{
							sql: SQL`delete from "public"."author"
              where "id" in (select "root_"."id"
                             from "public"."author" as "root_"
                             where "root_"."id" = ?)
              returning "id"`,
							parameters: [testUuid(1)],
							response: { rows: [{ id: testUuid(1) }] },
						},
						{
							sql: SQL`SET CONSTRAINTS ALL IMMEDIATE`,
							parameters: [],
							response: 1,
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
	})

	describe('one has many (post and locale)', () => {
		const postWithNullableLocale = new SchemaBuilder()
			.entity('Post', e =>
				e.oneHasMany('locales', r =>
					r.ownedBy('post').target('PostLocale', e =>
						e
							.unique(['locale', 'post'])
							.column('title', c => c.type(Model.ColumnType.String))
							.column('locale', c => c.type(Model.ColumnType.String)),
					),
				),
			)
			.buildSchema()

		const postWithLocale = new SchemaBuilder()
			.entity('Post', e =>
				e.oneHasMany('locales', r =>
					r
						.ownedBy('post')
						.ownerNotNull()
						.target('PostLocale', e =>
							e
								.unique(['locale', 'post'])
								.column('title', c => c.type(Model.ColumnType.String))
								.column('locale', c => c.type(Model.ColumnType.String)),
						),
				),
			)
			.buildSchema()

		it('create', async () => {
			await execute({
				schema: postWithLocale,
				query: GQL`mutation {
        updatePost(
            by: {id: "${testUuid(2)}"},
            data: {locales: [{create: {title: "Hello", locale: "cs"}}]}
          ) {
          ok
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(2)],
							response: { rows: [{ id: testUuid(2) }] },
						},
						// {
						// 	sql: SQL`select "root_"."id" as "root_id", "root_"."id" as "root_id" from "public"."post" as "root_" where "root_"."id" = ?`,
						// 	parameters: [testUuid(2)],
						// 	response: { rows: [{ root_id: testUuid(2) }] },
						// },
						// {
						// 	sql: SQL`select "root_"."post_id" as "__grouping_key", "root_"."id" as "root_id" from "public"."post_locale" as "root_" where "root_"."post_id" in (?)`,
						// 	parameters: [testUuid(2)],
						// 	response: { rows: [] },
						// },
						{
							sql: SQL`with "root_" as
							(select ? :: uuid as "id", ? :: text as "title", ? :: text as "locale", ? :: uuid as "post_id")
							insert into "public"."post_locale" ("id", "title", "locale", "post_id")
							select "root_"."id", "root_"."title", "root_"."locale", "root_"."post_id"
              from "root_"
							returning "id"`,
							parameters: [testUuid(1), 'Hello', 'cs', testUuid(2)],
							response: { rows: [{ id: testUuid(1) }] },
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

		it('update (composed unique)', async () => {
			await execute({
				schema: postWithLocale,
				query: GQL`mutation {
        updatePost(
            by: {id: "${testUuid(2)}"},
            data: {locales: [{update: {by: {locale: "cs"}, data: {title: "Hello"}}}]}
          ) {
          ok
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(2)],
							response: { rows: [{ id: testUuid(2) }] },
						},
						{
							sql: SQL`select "root_"."id"
                       from "public"."post_locale" as "root_"
                       where "root_"."locale" = ? and "root_"."post_id" = ?`,
							parameters: ['cs', testUuid(2)],
							response: {
								rows: [{ id: testUuid(1) }],
							},
						},
						{
							sql: SQL`with "newData_" as
              (select
                 ? :: text as "title",
                 "root_"."id",
                 "root_"."locale",
                 "root_"."post_id"
               from "public"."post_locale" as "root_"
               where "root_"."locale" = ? and "root_"."post_id" = ?) update "public"."post_locale"
              set "title" = "newData_"."title" from "newData_"
              where "post_locale"."id" = "newData_"."id"`,
							parameters: ['Hello', 'cs', testUuid(2)],
							response: { rowCount: 1 },
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

		it('upsert - exists (composed unique)', async () => {
			await execute({
				schema: postWithLocale,
				query: GQL`mutation {
        updatePost(
            by: {id: "${testUuid(2)}"},
            data: {locales: [{upsert: {by: {locale: "cs"}, update: {title: "Hello"}, create: {title: "World"}}}]}
          ) {
          ok
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(2)],
							response: { rows: [{ id: testUuid(2) }] },
						},
						{
							sql: SQL`select "root_"."id"
                       from "public"."post_locale" as "root_"
                       where "root_"."locale" = ? and "root_"."post_id" = ?`,
							parameters: ['cs', testUuid(2)],
							response: {
								rows: [{ id: testUuid(1) }],
							},
						},
						{
							sql: SQL`with "newData_" as
              (select
                 ? :: text as "title",
                 "root_"."id",
                 "root_"."locale",
                 "root_"."post_id"
               from "public"."post_locale" as "root_"
               where "root_"."locale" = ? and "root_"."post_id" = ?)
							update "public"."post_locale"
              set "title" = "newData_"."title" from "newData_"
              where "post_locale"."id" = "newData_"."id"`,
							parameters: ['Hello', 'cs', testUuid(2)],
							response: { rowCount: 1 },
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

		it('upsert - not exists (composed unique)', async () => {
			await execute({
				schema: postWithLocale,
				query: GQL`mutation {
        updatePost(
            by: {id: "${testUuid(2)}"},
            data: {locales: [{upsert: {by: {locale: "cs"}, update: {title: "Hello"}, create: {title: "World", locale: "cs"}}}]}
          ) {
          ok
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(2)],
							response: { rows: [{ id: testUuid(2) }] },
						},
						{
							sql: SQL`select "root_"."id"
                       from "public"."post_locale" as "root_"
                       where "root_"."locale" = ? and "root_"."post_id" = ?`,
							parameters: ['cs', testUuid(2)],
							response: {
								rows: [],
							},
						},
						{
							sql: SQL`with "root_" as
							(select ? :: uuid as "id", ? :: text as "title", ? :: text as "locale", ? :: uuid as "post_id")
							insert into "public"."post_locale" ("id", "title", "locale", "post_id")
							select "root_"."id", "root_"."title", "root_"."locale", "root_"."post_id"
              from "root_"
							returning "id"`,
							parameters: [testUuid(1), 'World', 'cs', testUuid(2)],
							response: { rows: [{ id: testUuid(1) }] },
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

		it('update (incomplete composed unique)', async () => {
			await execute({
				schema: postWithLocale,
				query: GQL`mutation {
        updatePost(
            by: {id: "${testUuid(2)}"},
            data: {locales: [{update: {by: {}, data: {title: "Hello"}}}]}
          ) {
          ok
          errors {
             type
             message
          }
        }
      }`,
				executes: failedTransaction([
					{
						sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?`,
						parameters: [testUuid(2)],
						response: { rows: [{ id: testUuid(2) }] },
					},
				]),
				return: {
					data: {
						updatePost: {
							ok: false,
							errors: [
								{
									type: 'NonUniqueWhereInput',
									message:
										'Provided where is not unique for entity PostLocale:\n' +
										'Provided value: {"post":{"id":"123e4567-e89b-12d3-a456-000000000002"}}\n' +
										'Known unique key combinations:\n' +
										'\t - id\n' +
										'\t - locale, post',
								},
							],
						},
					},
				},
			})
		})

		it('delete', async () => {
			await execute({
				schema: postWithLocale,
				query: GQL`mutation {
        updatePost(
            by: {id: "${testUuid(2)}"},
            data: {locales: [{delete: {locale: "cs"}}]}
          ) {
          ok
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(2)],
							response: { rows: [{ id: testUuid(2) }] },
						},
						{
							sql: SQL`SET CONSTRAINTS ALL DEFERRED`,
							parameters: [],
							response: 1,
						},
						{
							sql: SQL`select "root_"."id" from "public"."post_locale" as "root_" where "root_"."locale" = ? and "root_"."post_id" = ?`,
							parameters: ['cs', testUuid(2)],
							response: { rows: [{ id: testUuid(1) }] },
						},
						{
							sql: SQL`delete from "public"."post_locale"
              where "id" in (select "root_"."id"
                             from "public"."post_locale" as "root_"
                             where "root_"."id" = ?)
              returning "id"`,
							parameters: [testUuid(1)],
							response: { rows: [{ id: testUuid(1) }] },
						},
						{
							sql: SQL`SET CONSTRAINTS ALL IMMEDIATE`,
							parameters: [],
							response: 1,
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

		it('connect', async () => {
			await execute({
				schema: postWithLocale,
				query: GQL`mutation {
        updatePost(
            by: {id: "${testUuid(2)}"},
            data: {locales: [{connect: {id: "${testUuid(1)}"}}]}
          ) {
          ok
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(2)],
							response: { rows: [{ id: testUuid(2) }] },
						},
						{
							sql: SQL`select "root_"."id" from "public"."post_locale" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(1)],
							response: { rows: [{ id: testUuid(1) }] },
						},
						{
							sql: SQL`with "newData_" as
              (select
                 ? :: uuid as "post_id",
                 "root_"."id",
                 "root_"."title",
                 "root_"."locale"
               from "public"."post_locale" as "root_"
               where "root_"."id" = ?) update "public"."post_locale"
              set "post_id" = "newData_"."post_id" from "newData_"
              where "post_locale"."id" = "newData_"."id"`,
							parameters: [testUuid(2), testUuid(1)],
							response: { rowCount: 1 },
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

		it('disconnect', async () => {
			await execute({
				schema: postWithNullableLocale,
				query: GQL`mutation {
        updatePost(
            by: {id: "${testUuid(2)}"},
            data: {locales: [{disconnect: {id: "${testUuid(1)}"}}]}
          ) {
          ok
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(2)],
							response: { rows: [{ id: testUuid(2) }] },
						},
						{
							sql: SQL`select "root_"."id" from "public"."post_locale" as "root_" where "root_"."id" = ? and "root_"."post_id" = ?`,
							parameters: [testUuid(1), testUuid(2)],
							response: { rows: [{ id: testUuid(1) }] },
						},
						{
							sql: SQL`with "newData_" as
              (select
                 ? :: uuid as "post_id",
                 "root_"."id",
                 "root_"."title",
                 "root_"."locale"
               from "public"."post_locale" as "root_"
               where "root_"."id" = ? and "root_"."post_id" = ?) update "public"."post_locale"
              set "post_id" = "newData_"."post_id" from "newData_"
              where "post_locale"."id" = "newData_"."id"`,
							parameters: [null, testUuid(1), testUuid(2)],
							response: { rowCount: 1 },
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

		it('delete and create', async () => {
			await execute({
				schema: postWithLocale,
				query: GQL`mutation {
        updatePost(
            by: {id: "${testUuid(2)}"},
            data: {locales: [{delete: {locale: "cs"}}, {create: {title: "Hello", locale: "cs"}}]}
          ) {
          ok
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(2)],
							response: { rows: [{ id: testUuid(2) }] },
						},
						{
							sql: SQL`SET CONSTRAINTS ALL DEFERRED`,
							parameters: [],
							response: 1,
						},
						{
							sql: SQL`select "root_"."id" from "public"."post_locale" as "root_" where "root_"."locale" = ? and "root_"."post_id" = ?`,
							parameters: ['cs', testUuid(2)],
							response: { rows: [{ id: testUuid(9) }] },
						},
						{
							sql: SQL`delete from "public"."post_locale"
              where "id" in (select "root_"."id"
                             from "public"."post_locale" as "root_"
                             where "root_"."id" = ?)
              returning "id"`,
							parameters: [testUuid(9)],
							response: { rows: [{ id: testUuid(9) }] },
						},
						{
							sql: SQL`SET CONSTRAINTS ALL IMMEDIATE`,
							parameters: [],
							response: 1,
						},
						{
							sql: SQL`with "root_" as
							(select ? :: uuid as "id", ? :: text as "title", ? :: text as "locale", ? :: uuid as "post_id")
							insert into "public"."post_locale" ("id", "title", "locale", "post_id")
							select "root_"."id", "root_"."title", "root_"."locale", "root_"."post_id"
              from "root_"
							returning "id"`,
							parameters: [testUuid(1), 'Hello', 'cs', testUuid(2)],
							response: { rows: [{ id: testUuid(1) }] },
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
	})

	const siteSettingSchema = new SchemaBuilder()
		.entity('Site', entity =>
			entity
				.column('name', c => c.type(Model.ColumnType.String))
				.oneHasOne('setting', r =>
					r.inversedBy('site').target('SiteSetting', e => e.column('url', c => c.type(Model.ColumnType.String))),
				),
		)
		.buildSchema()

	describe('one has one owner (site and setting)', () => {
		const selectUpdateSiteSql = {
			sql: SQL`select "root_"."id" as "root_id"
               from "public"."site" as "root_"
               where "root_"."id" = ?`,
			response: {
				rows: [{ root_id: testUuid(2) }],
			},
			parameters: [testUuid(2)],
		}

		it('create', async () => {
			await execute({
				schema: siteSettingSchema,
				query: GQL`mutation {
        updateSite(
            by: {id: "${testUuid(2)}"},
            data: {setting: {create: {url: "http://mangoweb.cz"}}}
          ) {
          ok
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "root_"."id" from "public"."site" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(2)],
							response: { rows: [{ id: testUuid(2) }] },
						},
						// {
						// 	sql: SQL`select "root_"."setting_id" as "root_setting", "root_"."id" as "root_id" from "public"."site" as "root_" where "root_"."id" = ?`,
						// 	parameters: [testUuid(2)],
						// 	response: { rows: [{ root_id: testUuid(2), root_setting: testUuid(99) }] },
						// },
						// {
						// 	sql: SQL`select "root_"."id" as "root_id", "root_"."id" as "root_id" from "public"."site_setting" as "root_" where "root_"."id" in (?)`,
						// 	parameters: [testUuid(99)],
						// 	response: { rows: [{ root_id: testUuid(99) }] },
						// },
						{
							sql: SQL`with "root_" as
							(select ? :: uuid as "id", ? :: text as "url")
							insert into "public"."site_setting" ("id", "url")
							select "root_"."id", "root_"."url"
              from "root_"
							returning "id"`,
							parameters: [testUuid(1), 'http://mangoweb.cz'],
							response: { rows: [{ id: testUuid(1) }] },
						},
						{
							sql: SQL`with "newData_" as
              (select
                 ? :: uuid as "setting_id",
                 "root_"."id",
                 "root_"."name"
               from "public"."site" as "root_"
               where "root_"."id" = ?) update "public"."site"
              set "setting_id" = "newData_"."setting_id" from "newData_"
              where "site"."id" = "newData_"."id"`,
							parameters: [testUuid(1), testUuid(2)],
							response: { rowCount: 1 },
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

		it('update', async () => {
			await execute({
				schema: siteSettingSchema,
				query: GQL`mutation {
        updateSite(
            by: {id: "${testUuid(2)}"},
            data: {setting: {update: {url: "http://mangoweb.cz"}}}
          ) {
          ok
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "root_"."id" from "public"."site" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(2)],
							response: { rows: [{ id: testUuid(2) }] },
						},
						{
							sql: SQL`select "root_"."setting_id"
                       from "public"."site" as "root_"
                       where "root_"."id" = ?`,
							parameters: [testUuid(2)],
							response: {
								rows: [{ setting_id: testUuid(1) }],
							},
						},
						{
							sql: SQL`select "root_"."id" from "public"."site_setting" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(1)],
							response: { rows: [{ id: testUuid(1) }] },
						},
						{
							sql: SQL`with "newData_" as
              (select
                 ? :: text as "url",
                 "root_"."id"
               from "public"."site_setting" as "root_"
               where "root_"."id" = ?) update "public"."site_setting"
              set "url" = "newData_"."url" from "newData_"
              where "site_setting"."id" = "newData_"."id"`,
							parameters: ['http://mangoweb.cz', testUuid(1)],
							response: { rowCount: 1 },
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

		it('connect - same owner', async () => {
			await execute({
				schema: siteSettingSchema,
				query: GQL`mutation {
        updateSite(
            by: {id: "${testUuid(2)}"},
            data: {setting: {connect: {id: "${testUuid(1)}"}}}
          ) {
          ok
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "root_"."id" from "public"."site" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(2)],
							response: { rows: [{ id: testUuid(2) }] },
						},
						{
							sql: SQL`select "root_"."id" from "public"."site_setting" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(1)],
							response: { rows: [{ id: testUuid(1) }] },
						},
						{
							sql: SQL`select "root_"."id"
                       from "public"."site" as "root_"
                       where "root_"."setting_id" = ?`,
							parameters: [testUuid(1)],
							response: {
								rows: [{ id: testUuid(2) }],
							},
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

		it('connect - no owner', async () => {
			await execute({
				schema: siteSettingSchema,
				query: GQL`mutation {
        updateSite(
            by: {id: "${testUuid(2)}"},
            data: {setting: {connect: {id: "${testUuid(1)}"}}}
          ) {
          ok
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "root_"."id" from "public"."site" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(2)],
							response: { rows: [{ id: testUuid(2) }] },
						},
						{
							sql: SQL`select "root_"."id" from "public"."site_setting" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(1)],
							response: { rows: [{ id: testUuid(1) }] },
						},
						{
							sql: SQL`select "root_"."id"
                       from "public"."site" as "root_"
                       where "root_"."setting_id" = ?`,
							parameters: [testUuid(1)],
							response: {
								rows: [],
							},
						},
						{
							sql: SQL`with "newData_" as
              (select
                 ? :: uuid as "setting_id",
                 "root_"."id",
                 "root_"."name"
               from "public"."site" as "root_"
               where "root_"."id" = ?) update "public"."site"
              set "setting_id" = "newData_"."setting_id" from "newData_"
              where "site"."id" = "newData_"."id"`,
							parameters: [testUuid(1), testUuid(2)],
							response: { rowCount: 1 },
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

		it('connect - different owner', async () => {
			await execute({
				schema: siteSettingSchema,
				query: GQL`mutation {
        updateSite(
            by: {id: "${testUuid(2)}"},
            data: {setting: {connect: {id: "${testUuid(1)}"}}}
          ) {
          ok
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "root_"."id" from "public"."site" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(2)],
							response: { rows: [{ id: testUuid(2) }] },
						},
						{
							sql: SQL`select "root_"."id" from "public"."site_setting" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(1)],
							response: { rows: [{ id: testUuid(1) }] },
						},
						{
							sql: SQL`select "root_"."id"
                       from "public"."site" as "root_"
                       where "root_"."setting_id" = ?`,
							parameters: [testUuid(1)],
							response: {
								rows: [{ id: testUuid(3) }],
							},
						},
						{
							sql: SQL`with "newData_" as
              (select
                 ? :: uuid as "setting_id",
                 "root_"."id",
                 "root_"."name"
               from "public"."site" as "root_"
               where "root_"."id" = ?) update "public"."site"
              set "setting_id" = "newData_"."setting_id" from "newData_"
              where "site"."id" = "newData_"."id"`,
							parameters: [null, testUuid(3)],
							response: { rowCount: 1 },
						},
						{
							sql: SQL`with "newData_" as
              (select
                 ? :: uuid as "setting_id",
                 "root_"."id",
                 "root_"."name"
               from "public"."site" as "root_"
               where "root_"."id" = ?) update "public"."site"
              set "setting_id" = "newData_"."setting_id" from "newData_"
              where "site"."id" = "newData_"."id"`,
							parameters: [testUuid(1), testUuid(2)],
							response: { rowCount: 1 },
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

		it('upsert - exists', async () => {
			await execute({
				schema: siteSettingSchema,
				query: GQL`mutation {
        updateSite(
            by: {id: "${testUuid(2)}"},
            data: {setting: {upsert: {update: {url: "http://mangoweb.cz"}, create: {url: "http://mgw.cz"}}}}
          ) {
          ok
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "root_"."id" from "public"."site" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(2)],
							response: { rows: [{ id: testUuid(2) }] },
						},
						{
							sql: SQL`select "root_"."setting_id"
                       from "public"."site" as "root_"
                       where "root_"."id" = ?`,
							parameters: [testUuid(2)],
							response: {
								rows: [{ setting_id: testUuid(1) }],
							},
						},
						{
							sql: SQL`select "root_"."id" from "public"."site_setting" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(1)],
							response: { rows: [{ id: testUuid(1) }] },
						},
						{
							sql: SQL`with "newData_" as
              (select
                 ? :: text as "url",
                 "root_"."id"
               from "public"."site_setting" as "root_"
               where "root_"."id" = ?) update "public"."site_setting"
              set "url" = "newData_"."url" from "newData_"
              where "site_setting"."id" = "newData_"."id"`,
							parameters: ['http://mangoweb.cz', testUuid(1)],
							response: { rowCount: 1 },
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

		it('upsert - not exists', async () => {
			await execute({
				schema: siteSettingSchema,
				query: GQL`mutation {
        updateSite(
            by: {id: "${testUuid(2)}"},
            data: {setting: {upsert: {update: {url: "http://mangoweb.cz"}, create: {url: "http://mgw.cz"}}}}
          ) {
          ok
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "root_"."id" from "public"."site" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(2)],
							response: { rows: [{ id: testUuid(2) }] },
						},
						{
							sql: SQL`select "root_"."setting_id"
                       from "public"."site" as "root_"
                       where "root_"."id" = ?`,
							parameters: [testUuid(2)],
							response: {
								rows: [],
							},
						},
						{
							sql: SQL`with "root_" as
							(select ? :: uuid as "id", ? :: text as "url")
							insert into "public"."site_setting" ("id", "url")
							select "root_"."id", "root_"."url"
              from "root_"
							returning "id"`,
							parameters: [testUuid(1), 'http://mgw.cz'],
							response: { rows: [{ id: testUuid(1) }] },
						},
						{
							sql: SQL`with "newData_" as
              (select
                 ? :: uuid as "setting_id",
                 "root_"."id",
                 "root_"."name"
               from "public"."site" as "root_"
               where "root_"."id" = ?) update "public"."site"
              set "setting_id" = "newData_"."setting_id" from "newData_"
              where "site"."id" = "newData_"."id"`,
							parameters: [testUuid(1), testUuid(2)],
							response: { rowCount: 1 },
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

		it('disconnect', async () => {
			await execute({
				schema: siteSettingSchema,
				query: GQL`mutation {
        updateSite(
            by: {id: "${testUuid(2)}"},
            data: {setting: {disconnect: true}}
          ) {
          ok
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "root_"."id" from "public"."site" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(2)],
							response: { rows: [{ id: testUuid(2) }] },
						},
						{
							sql: SQL`with "newData_" as
              (select
                 ? :: uuid as "setting_id",
                 "root_"."id",
                 "root_"."name"
               from "public"."site" as "root_"
               where "root_"."id" = ?) update "public"."site"
              set "setting_id" = "newData_"."setting_id" from "newData_"
              where "site"."id" = "newData_"."id"`,
							parameters: [null, testUuid(2)],
							response: { rowCount: 1 },
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

		it('delete', async () => {
			await execute({
				schema: siteSettingSchema,
				query: GQL`mutation {
        updateSite(
            by: {id: "${testUuid(2)}"},
            data: {setting: {delete: true}}
          ) {
          ok
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "root_"."id" from "public"."site" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(2)],
							response: { rows: [{ id: testUuid(2) }] },
						},
						{
							sql: SQL`select "root_"."setting_id"
                       from "public"."site" as "root_"
                       where "root_"."id" = ?`,
							parameters: [testUuid(2)],
							response: {
								rows: [{ setting_id: testUuid(1) }],
							},
						},
						{
							sql: SQL`with "newData_" as
              (select
                 ? :: uuid as "setting_id",
                 "root_"."id",
                 "root_"."name"
               from "public"."site" as "root_"
               where "root_"."id" = ?) update "public"."site"
              set "setting_id" = "newData_"."setting_id" from "newData_"
              where "site"."id" = "newData_"."id"`,
							parameters: [null, testUuid(2)],
							response: { rowCount: 1 },
						},
						{
							sql: SQL`SET CONSTRAINTS ALL DEFERRED`,
							parameters: [],
							response: 1,
						},
						{
							sql: SQL`select "root_"."id" from "public"."site_setting" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(1)],
							response: { rows: [{ id: testUuid(1) }] },
						},
						{
							sql: SQL`delete from "public"."site_setting"
              where "id" in (select "root_"."id"
                             from "public"."site_setting" as "root_"
                             where "root_"."id" = ?)
              returning "id"`,
							parameters: [testUuid(1)],
							response: { rows: [{ id: testUuid(1) }] },
						},
						{
							sql: SQL`SET CONSTRAINTS ALL IMMEDIATE`,
							parameters: [],
							response: 1,
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
	})

	describe('one has one inversed (site and setting)', () => {
		const selectUpdateSiteSettingSql = {
			sql: SQL`select "root_"."id" as "root_id"
               from "public"."site_setting" as "root_"
               where "root_"."id" = ?`,
			response: {
				rows: [{ root_id: testUuid(2) }],
			},
			parameters: [testUuid(2)],
		}

		it('create', async () => {
			await execute({
				schema: siteSettingSchema,
				query: GQL`mutation {
        updateSiteSetting(
            by: {id: "${testUuid(2)}"},
            data: {site: {create: {name: "Mangoweb"}}}
          ) {
          ok
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "root_"."id" from "public"."site_setting" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(2)],
							response: { rows: [{ id: testUuid(2) }] },
						},
						// {
						// 	sql: SQL`select "root_"."id" as "root_id", "root_"."id" as "root_id" from "public"."site_setting" as "root_" where "root_"."id" = ?`,
						// 	parameters: [testUuid(2)],
						// 	response: {
						// 		rows: [{ root_id: testUuid(2) }],
						// 	},
						// },
						// {
						// 	sql: SQL`select "root_"."setting_id" as "root_setting", "root_"."id" as "root_id" from "public"."site" as "root_" where "root_"."setting_id" in (?)`,
						// 	parameters: [testUuid(2)],
						// 	response: {
						// 		rows: [{ root_id: testUuid(99), root_setting: testUuid(2) }],
						// 	},
						// },
						{
							sql: SQL`select "root_"."id"
                       from "public"."site" as "root_"
                       where "root_"."setting_id" = ?`,
							parameters: [testUuid(2)],
							response: {
								rows: [{ id: testUuid(3) }],
							},
						},
						{
							sql: SQL`with "newData_" as
              (select
                 ? :: uuid as "setting_id",
                 "root_"."id",
                 "root_"."name"
               from "public"."site" as "root_"
               where "root_"."setting_id" = ?) update "public"."site"
              set "setting_id" = "newData_"."setting_id" from "newData_"
              where "site"."id" = "newData_"."id"`,
							parameters: [null, testUuid(2)],
							response: { rowCount: 1 },
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
					]),
				],
				return: {
					data: {
						updateSiteSetting: {
							ok: true,
						},
					},
				},
			})
		})

		it('create - no owner', async () => {
			await execute({
				schema: siteSettingSchema,
				query: GQL`mutation {
        updateSiteSetting(
            by: {id: "${testUuid(2)}"},
            data: {site: {create: {name: "Mangoweb"}}}
          ) {
          ok
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "root_"."id" from "public"."site_setting" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(2)],
							response: { rows: [{ id: testUuid(2) }] },
						},
						// {
						// 	sql: SQL`select "root_"."id" as "root_id", "root_"."id" as "root_id" from "public"."site_setting" as "root_" where "root_"."id" = ?`,
						// 	parameters: [testUuid(2)],
						// 	response: {
						// 		rows: [{ root_id: testUuid(2) }],
						// 	},
						// },
						// {
						// 	sql: SQL`select "root_"."setting_id" as "root_setting", "root_"."id" as "root_id" from "public"."site" as "root_" where "root_"."setting_id" in (?)`,
						// 	parameters: [testUuid(2)],
						// 	response: {
						// 		rows: [{ root_id: testUuid(99), root_setting: testUuid(2) }],
						// 	},
						// },
						{
							sql: SQL`select "root_"."id"
                       from "public"."site" as "root_"
                       where "root_"."setting_id" = ?`,
							parameters: [testUuid(2)],
							response: {
								rows: [],
							},
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
					]),
				],
				return: {
					data: {
						updateSiteSetting: {
							ok: true,
						},
					},
				},
			})
		})

		it('update', async () => {
			await execute({
				schema: siteSettingSchema,
				query: GQL`mutation {
        updateSiteSetting(
            by: {id: "${testUuid(2)}"},
            data: {site: {update: {name: "Mangoweb"}}}
          ) {
          ok
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "root_"."id" from "public"."site_setting" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(2)],
							response: { rows: [{ id: testUuid(2) }] },
						},
						{
							sql: SQL`select "root_"."id"
                       from "public"."site" as "root_"
                       where "root_"."setting_id" = ?`,
							parameters: [testUuid(2)],
							response: {
								rows: [{ id: testUuid(1) }],
							},
						},
						{
							sql: SQL`with "newData_" as
              (select
                 ? :: text as "name",
                 "root_"."id",
                 "root_"."setting_id"
               from "public"."site" as "root_"
               where "root_"."setting_id" = ?) update "public"."site"
              set "name" = "newData_"."name" from "newData_"
              where "site"."id" = "newData_"."id"`,
							parameters: ['Mangoweb', testUuid(2)],
							response: { rowCount: 1 },
						},
					]),
				],
				return: {
					data: {
						updateSiteSetting: {
							ok: true,
						},
					},
				},
			})
		})

		it('upsert - exists', async () => {
			await execute({
				schema: siteSettingSchema,
				query: GQL`mutation {
        updateSiteSetting(
            by: {id: "${testUuid(2)}"},
            data: {site: {upsert: {update: {name: "Mangoweb"}, create: {name: "Mgw"}}}}
          ) {
          ok
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "root_"."id" from "public"."site_setting" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(2)],
							response: { rows: [{ id: testUuid(2) }] },
						},
						{
							sql: SQL`select "root_"."id"
                       from "public"."site" as "root_"
                       where "root_"."setting_id" = ?`,
							parameters: [testUuid(2)],
							response: {
								rows: [{ id: testUuid(1) }],
							},
						},
						{
							sql: SQL`with "newData_" as
              (select
                 ? :: text as "name",
                 "root_"."id",
                 "root_"."setting_id"
               from "public"."site" as "root_"
               where "root_"."setting_id" = ?) update "public"."site"
              set "name" = "newData_"."name" from "newData_"
              where "site"."id" = "newData_"."id"`,
							parameters: ['Mangoweb', testUuid(2)],
							response: { rowCount: 1 },
						},
					]),
				],
				return: {
					data: {
						updateSiteSetting: {
							ok: true,
						},
					},
				},
			})
		})

		it('upsert - not exists', async () => {
			await execute({
				schema: siteSettingSchema,
				query: GQL`mutation {
        updateSiteSetting(
            by: {id: "${testUuid(2)}"},
           data: {site: {upsert: {update: {name: "Mangoweb"}, create: {name: "Mgw"}}}}
          ) {
          ok
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "root_"."id" from "public"."site_setting" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(2)],
							response: { rows: [{ id: testUuid(2) }] },
						},
						{
							sql: SQL`select "root_"."id"
                       from "public"."site" as "root_"
                       where "root_"."setting_id" = ?`,
							parameters: [testUuid(2)],
							response: {
								rows: [],
							},
						},
						{
							sql: SQL`with "root_" as
							(select ? :: uuid as "id", ? :: text as "name", ? :: uuid as "setting_id")
							insert into "public"."site" ("id", "name", "setting_id")
							select "root_"."id", "root_"."name", "root_"."setting_id"
              from "root_"
							returning "id"`,
							parameters: [testUuid(1), 'Mgw', testUuid(2)],
							response: { rows: [{ id: testUuid(1) }] },
						},
					]),
				],
				return: {
					data: {
						updateSiteSetting: {
							ok: true,
						},
					},
				},
			})
		})

		it('disconnect', async () => {
			await execute({
				schema: siteSettingSchema,
				query: GQL`mutation {
        updateSiteSetting(
            by: {id: "${testUuid(2)}"},
            data: {site: {disconnect: true}}
          ) {
          ok
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "root_"."id" from "public"."site_setting" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(2)],
							response: { rows: [{ id: testUuid(2) }] },
						},
						{
							sql: SQL`select "root_"."id"
                       from "public"."site" as "root_"
                       where "root_"."setting_id" = ?`,
							parameters: [testUuid(2)],
							response: {
								rows: [{ id: testUuid(1) }],
							},
						},
						{
							sql: SQL`with "newData_" as
              (select
                 ? :: uuid as "setting_id",
                 "root_"."id",
                 "root_"."name"
               from "public"."site" as "root_"
               where "root_"."setting_id" = ?) update "public"."site"
              set "setting_id" = "newData_"."setting_id" from "newData_"
              where "site"."id" = "newData_"."id"`,
							parameters: [null, testUuid(2)],
							response: { rowCount: 1 },
						},
					]),
				],
				return: {
					data: {
						updateSiteSetting: {
							ok: true,
						},
					},
				},
			})
		})

		it('delete', async () => {
			await execute({
				schema: siteSettingSchema,
				query: GQL`mutation {
        updateSiteSetting(
            by: {id: "${testUuid(2)}"},
            data: {site: {delete: true}}
          ) {
          ok
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "root_"."id" from "public"."site_setting" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(2)],
							response: { rows: [{ id: testUuid(2) }] },
						},
						{
							sql: SQL`SET CONSTRAINTS ALL DEFERRED`,
							parameters: [],
							response: 1,
						},
						{
							sql: SQL`select "root_"."id" from "public"."site" as "root_" where "root_"."setting_id" = ?`,
							parameters: [testUuid(2)],
							response: { rows: [{ id: testUuid(1) }] },
						},
						{
							sql: SQL`delete from "public"."site"
              where "id" in (select "root_"."id"
                             from "public"."site" as "root_"
                             where "root_"."id" = ?)
              returning "id"`,
							parameters: [testUuid(1)],
							response: { rows: [{ id: testUuid(1) }] },
						},
						{
							sql: SQL`SET CONSTRAINTS ALL IMMEDIATE`,
							parameters: [],
							response: 1,
						},
					]),
				],
				return: {
					data: {
						updateSiteSetting: {
							ok: true,
						},
					},
				},
			})
		})

		it('connect - same owner', async () => {
			await execute({
				schema: siteSettingSchema,
				query: GQL`mutation {
        updateSiteSetting(
            by: {id: "${testUuid(2)}"},
            data: {site: {connect: {id: "${testUuid(1)}"}}}
          ) {
          ok
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "root_"."id" from "public"."site_setting" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(2)],
							response: { rows: [{ id: testUuid(2) }] },
						},
						{
							sql: SQL`select "root_"."id" from "public"."site" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(1)],
							response: {
								rows: [{ id: testUuid(1) }],
							},
						},
						{
							sql: SQL`select "root_"."id"
                       from "public"."site" as "root_"
                       where "root_"."setting_id" = ?`,
							parameters: [testUuid(2)],
							response: {
								rows: [{ id: testUuid(1) }],
							},
						},
					]),
				],
				return: {
					data: {
						updateSiteSetting: {
							ok: true,
						},
					},
				},
			})
		})

		it('connect - no owner', async () => {
			await execute({
				schema: siteSettingSchema,
				query: GQL`mutation {
        updateSiteSetting(
            by: {id: "${testUuid(2)}"},
            data: {site: {connect: {id: "${testUuid(1)}"}}}
          ) {
          ok
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "root_"."id" from "public"."site_setting" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(2)],
							response: { rows: [{ id: testUuid(2) }] },
						},
						{
							sql: SQL`select "root_"."id" from "public"."site" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(1)],
							response: {
								rows: [{ id: testUuid(1) }],
							},
						},
						{
							sql: SQL`select "root_"."id"
                       from "public"."site" as "root_"
                       where "root_"."setting_id" = ?`,
							parameters: [testUuid(2)],
							response: {
								rows: [],
							},
						},
						{
							sql: SQL`with "newData_" as
              (select
                 ? :: uuid as "setting_id",
                 "root_"."id",
                 "root_"."name"
               from "public"."site" as "root_"
               where "root_"."id" = ?) update "public"."site"
              set "setting_id" = "newData_"."setting_id" from "newData_"
              where "site"."id" = "newData_"."id"`,
							parameters: [testUuid(2), testUuid(1)],
							response: { rowCount: 1 },
						},
					]),
				],
				return: {
					data: {
						updateSiteSetting: {
							ok: true,
						},
					},
				},
			})
		})

		it('connect - different owner', async () => {
			await execute({
				schema: siteSettingSchema,
				query: GQL`mutation {
        updateSiteSetting(
            by: {id: "${testUuid(2)}"},
            data: {site: {connect: {id: "${testUuid(1)}"}}}
          ) {
          ok
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "root_"."id" from "public"."site_setting" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(2)],
							response: { rows: [{ id: testUuid(2) }] },
						},
						{
							sql: SQL`select "root_"."id" from "public"."site" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(1)],
							response: {
								rows: [{ id: testUuid(1) }],
							},
						},
						{
							sql: SQL`select "root_"."id"
                       from "public"."site" as "root_"
                       where "root_"."setting_id" = ?`,
							parameters: [testUuid(2)],
							response: {
								rows: [{ id: testUuid(3) }],
							},
						},
						{
							sql: SQL`with "newData_" as
              (select
                 ? :: uuid as "setting_id",
                 "root_"."id",
                 "root_"."name"
               from "public"."site" as "root_"
               where "root_"."id" = ?) update "public"."site"
              set "setting_id" = "newData_"."setting_id" from "newData_"
              where "site"."id" = "newData_"."id"`,
							parameters: [null, testUuid(3)],
							response: { rowCount: 1 },
						},
						{
							sql: SQL`with "newData_" as
              (select
                 ? :: uuid as "setting_id",
                 "root_"."id",
                 "root_"."name"
               from "public"."site" as "root_"
               where "root_"."id" = ?) update "public"."site"
              set "setting_id" = "newData_"."setting_id" from "newData_"
              where "site"."id" = "newData_"."id"`,
							parameters: [testUuid(2), testUuid(1)],
							response: { rowCount: 1 },
						},
					]),
				],
				return: {
					data: {
						updateSiteSetting: {
							ok: true,
						},
					},
				},
			})
		})
	})

	const postWithCategories = new SchemaBuilder()
		.entity('Post', e =>
			e
				.manyHasMany('categories', r => r.target('Category').inversedBy('posts'))
				.column('title', c => c.type(Model.ColumnType.String)),
		)
		.entity('Category', e => e.column('name', c => c.type(Model.ColumnType.String)))
		.buildSchema()

	describe('many has many owning (post categories)', () => {
		it('connect', async () => {
			await execute({
				schema: postWithCategories,
				query: GQL`mutation {
        updatePost(
            by: {id: "${testUuid(2)}"},
            data: {categories: [{connect: {id: "${testUuid(3)}"}}]}
          ) {
          ok
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(2)],
							response: { rows: [{ id: testUuid(2) }] },
						},
						{
							sql: SQL`select "root_"."id" from "public"."category" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(3)],
							response: { rows: [{ id: testUuid(3) }] },
						},
						{
							sql: SQL`insert into "public"."post_categories" ("post_id", "category_id")
              values (?, ?)
              on conflict do nothing`,
							parameters: [testUuid(2), testUuid(3)],
							response: { rowCount: 1 },
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

		it('create', async () => {
			await execute({
				schema: postWithCategories,
				query: GQL`mutation {
        updatePost(
            by: {id: "${testUuid(2)}"},
            data: {categories: [{create: {name: "Lorem"}}]}
          ) {
          ok
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(2)],
							response: { rows: [{ id: testUuid(2) }] },
						},
						// {
						// 	sql: SQL`select "root_"."id" as "root_id", "root_"."id" as "root_id" from "public"."post" as "root_" where "root_"."id" = ?`,
						// 	parameters: [testUuid(2)],
						// 	response: {
						// 		rows: [{ root_id: testUuid(2) }],
						// 	},
						// },
						// {
						// 	sql: SQL`select "junction_"."category_id", "junction_"."post_id" from "public"."post_categories" as "junction_" where "junction_"."post_id" in (?)`,
						// 	parameters: [testUuid(2)],
						// 	response: {
						// 		rows: [],
						// 	},
						// },
						{
							sql: SQL`with "root_" as
							(select ? :: uuid as "id", ? :: text as "name")
							insert into "public"."category" ("id", "name")
							select "root_"."id", "root_"."name"
              from "root_"
							returning "id"`,
							parameters: [testUuid(1), 'Lorem'],
							response: { rows: [{ id: testUuid(1) }] },
						},
						{
							sql: SQL`insert into "public"."post_categories" ("post_id", "category_id")
              values (?, ?)
              on conflict do nothing`,
							parameters: [testUuid(2), testUuid(1)],
							response: { rowCount: 1 },
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

		it('delete', async () => {
			await execute({
				schema: postWithCategories,
				query: GQL`mutation {
        updatePost(
            by: {id: "${testUuid(2)}"},
            data: {categories: [{delete: {id: "${testUuid(1)}"}}]}
          ) {
          ok
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(2)],
							response: { rows: [{ id: testUuid(2) }] },
						},
						{
							sql: SQL`SET CONSTRAINTS ALL DEFERRED`,
							parameters: [],
							response: 1,
						},
						{
							sql: SQL`select "root_"."id" from "public"."category" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(1)],
							response: { rows: [{ id: testUuid(1) }] },
						},
						{
							sql: SQL`delete from "public"."category"
              where "id" in (select "root_"."id"
                             from "public"."category" as "root_"
                             where "root_"."id" = ?)
              returning "id"`,
							parameters: [testUuid(1)],
							response: { rows: [{ id: testUuid(1) }] },
						},
						{
							sql: SQL`SET CONSTRAINTS ALL IMMEDIATE`,
							parameters: [],
							response: 1,
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

		it('disconnect', async () => {
			await execute({
				schema: postWithCategories,
				query: GQL`mutation {
        updatePost(
            by: {id: "${testUuid(2)}"},
            data: {categories: [{disconnect: {id: "${testUuid(1)}"}}]}
          ) {
          ok
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(2)],
							response: { rows: [{ id: testUuid(2) }] },
						},
						{
							sql: SQL`select "root_"."id" from "public"."category" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(1)],
							response: { rows: [{ id: testUuid(1) }] },
						},
						{
							sql: SQL`delete from "public"."post_categories"
              where "post_id" = ? and "category_id" = ?`,
							parameters: [testUuid(2), testUuid(1)],
							response: { rowCount: 1 },
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

		it('update', async () => {
			await execute({
				schema: postWithCategories,
				query: GQL`mutation {
        updatePost(
            by: {id: "${testUuid(2)}"},
            data: {categories: [{update: {by: {id: "${testUuid(1)}"}, data: {name: "Lorem"}}}]}
          ) {
          ok
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(2)],
							response: { rows: [{ id: testUuid(2) }] },
						},
						{
							sql: SQL`select "root_"."id" from "public"."category" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(1)],
							response: { rows: [{ id: testUuid(1) }] },
						},
						{
							sql: SQL`with "newData_" as
              (select
                 ? :: text as "name",
                 "root_"."id"
               from "public"."category" as "root_"
               where "root_"."id" = ?) update "public"."category"
              set "name" = "newData_"."name" from "newData_"
              where "category"."id" = "newData_"."id"`,
							parameters: ['Lorem', testUuid(1)],
							response: { rowCount: 1 },
						},
						{
							sql: SQL`insert into "public"."post_categories" ("post_id", "category_id")
              values (?, ?)
              on conflict do nothing`,
							parameters: [testUuid(2), testUuid(1)],
							response: { rowCount: 1 },
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

		it('upsert - exists', async () => {
			await execute({
				schema: postWithCategories,
				query: GQL`mutation {
        updatePost(
            by: {id: "${testUuid(2)}"},
            data: {categories: [{upsert: {by: {id: "${testUuid(
							1,
						)}"}, update: {name: "Lorem"}, create: {name: "Ipsum"}}}]}
          ) {
          ok
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(2)],
							response: { rows: [{ id: testUuid(2) }] },
						},
						{
							sql: SQL`select "root_"."id" from "public"."category" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(1)],
							response: { rows: [{ id: testUuid(1) }] },
						},
						{
							sql: SQL`with "newData_" as
              (select
                 ? :: text as "name",
                 "root_"."id"
               from "public"."category" as "root_"
               where "root_"."id" = ?) update "public"."category"
              set "name" = "newData_"."name" from "newData_"
              where "category"."id" = "newData_"."id"`,
							parameters: ['Lorem', testUuid(1)],
							response: { rowCount: 1 },
						},
						{
							sql: SQL`insert into "public"."post_categories" ("post_id", "category_id")
              values (?, ?)
              on conflict do nothing`,
							parameters: [testUuid(2), testUuid(1)],
							response: { rowCount: 1 },
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

		it('upsert - not exists', async () => {
			await execute({
				schema: postWithCategories,
				query: GQL`mutation {
        updatePost(
            by: {id: "${testUuid(2)}"},
            data: {categories: [{upsert: {by: {id: "${testUuid(
							1,
						)}"}, update: {name: "Lorem"}, create: {name: "Ipsum"}}}]}
          ) {
          ok
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(2)],
							response: { rows: [{ id: testUuid(2) }] },
						},
						{
							sql: SQL`select "root_"."id" from "public"."category" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(1)],
							response: { rows: [] },
						},
						{
							sql: SQL`with "root_" as
							(select ? :: uuid as "id", ? :: text as "name")
							insert into "public"."category" ("id", "name")
							select "root_"."id", "root_"."name"
              from "root_"
							returning "id"`,
							parameters: [testUuid(1), 'Ipsum'],
							response: { rows: [{ id: testUuid(1) }] },
						},
						{
							sql: SQL`insert into "public"."post_categories" ("post_id", "category_id")
              values (?, ?)
              on conflict do nothing`,
							parameters: [testUuid(2), testUuid(1)],
							response: { rowCount: 1 },
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
	})

	describe('many has many inversed (category posts)', () => {
		const selectUpdateCategorySql = {
			sql: SQL`select "root_"."id" as "root_id"
               from "public"."category" as "root_"
               where "root_"."id" = ?`,
			response: {
				rows: [{ root_id: testUuid(2) }],
			},
			parameters: [testUuid(2)],
		}

		it('connect', async () => {
			await execute({
				schema: postWithCategories,
				query: GQL`mutation {
        updateCategory(
            by: {id: "${testUuid(2)}"},
            data: {posts: [{connect: {id: "${testUuid(1)}"}}]}
          ) {
          ok
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "root_"."id" from "public"."category" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(2)],
							response: { rows: [{ id: testUuid(2) }] },
						},
						{
							sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(1)],
							response: { rows: [{ id: testUuid(1) }] },
						},
						{
							sql: SQL`insert into "public"."post_categories" ("post_id", "category_id")
							values (?, ?)
              on conflict do nothing`,
							parameters: [testUuid(1), testUuid(2)],
							response: 1,
						},
					]),
				],
				return: {
					data: {
						updateCategory: {
							ok: true,
						},
					},
				},
			})
		})

		it('create', async () => {
			await execute({
				schema: postWithCategories,
				query: GQL`mutation {
        updateCategory(
            by: {id: "${testUuid(2)}"},
            data: {posts: [{create: {title: "Lorem"}}]}
          ) {
          ok
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "root_"."id" from "public"."category" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(2)],
							response: {
								rows: [{ id: testUuid(2) }],
							},
						},
						// {
						// 	sql: SQL`select "root_"."id" as "root_id", "root_"."id" as "root_id" from "public"."category" as "root_" where "root_"."id" = ?`,
						// 	parameters: [testUuid(2)],
						// 	response: {
						// 		rows: [{ root_id: testUuid(2) }],
						// 	},
						// },
						// {
						// 	sql: SQL`select "junction_"."category_id", "junction_"."post_id" from "public"."post_categories" as "junction_" where "junction_"."category_id" in (?)`,
						// 	parameters: [testUuid(2)],
						// 	response: {
						// 		rows: [],
						// 	},
						// },
						{
							sql: SQL`with "root_" as
							(select ? :: uuid as "id", ? :: text as "title")
							insert into "public"."post" ("id", "title")
							select "root_"."id", "root_"."title"
              from "root_"
							returning "id"`,
							parameters: [testUuid(1), 'Lorem'],
							response: { rows: [{ id: testUuid(1) }] },
						},
						{
							sql: SQL`insert into "public"."post_categories" ("post_id", "category_id")
              values (?, ?)
              on conflict do nothing`,
							parameters: [testUuid(1), testUuid(2)],
							response: 1,
						},
					]),
				],
				return: {
					data: {
						updateCategory: {
							ok: true,
						},
					},
				},
			})
		})

		it('delete', async () => {
			await execute({
				schema: postWithCategories,
				query: GQL`mutation {
        updateCategory(
            by: {id: "${testUuid(2)}"},
            data: {posts: [{delete: {id: "${testUuid(1)}"}}]}
          ) {
          ok
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "root_"."id" from "public"."category" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(2)],
							response: { rows: [{ id: testUuid(2) }] },
						},
						{
							sql: SQL`SET CONSTRAINTS ALL DEFERRED`,
							parameters: [],
							response: 1,
						},
						{
							sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(1)],
							response: { rows: [{ id: testUuid(1) }] },
						},
						{
							sql: SQL`delete from "public"."post"
              where "id" in (select "root_"."id"
                             from "public"."post" as "root_"
                             where "root_"."id" = ?)
              returning "id"`,
							parameters: [testUuid(1)],
							response: { rows: [{ id: testUuid(1) }] },
						},
						{
							sql: SQL`SET CONSTRAINTS ALL IMMEDIATE`,
							parameters: [],
							response: 1,
						},
					]),
				],
				return: {
					data: {
						updateCategory: {
							ok: true,
						},
					},
				},
			})
		})

		it('disconnect', async () => {
			await execute({
				schema: postWithCategories,
				query: GQL`mutation {
        updateCategory(
            by: {id: "${testUuid(2)}"},
            data: {posts: [{disconnect: {id: "${testUuid(1)}"}}]}
          ) {
          ok
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "root_"."id" from "public"."category" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(2)],
							response: { rows: [{ id: testUuid(2) }] },
						},
						{
							sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(1)],
							response: { rows: [{ id: testUuid(1) }] },
						},
						{
							sql: SQL`delete from "public"."post_categories"
              where "post_id" = ? and "category_id" = ?`,
							parameters: [testUuid(1), testUuid(2)],
							response: { rowCount: 1 },
						},
					]),
				],
				return: {
					data: {
						updateCategory: {
							ok: true,
						},
					},
				},
			})
		})

		it('update', async () => {
			await execute({
				schema: postWithCategories,
				query: GQL`mutation {
        updateCategory(
            by: {id: "${testUuid(2)}"},
            data: {posts: [{update: {by: {id: "${testUuid(1)}"}, data: {title: "Lorem"}}}]}
          ) {
          ok
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "root_"."id" from "public"."category" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(2)],
							response: { rows: [{ id: testUuid(2) }] },
						},
						{
							sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(1)],
							response: { rows: [{ id: testUuid(1) }] },
						},
						{
							sql: SQL`with "newData_" as
              (select
                 ? :: text as "title",
                 "root_"."id"
               from "public"."post" as "root_"
               where "root_"."id" = ?) update "public"."post"
              set "title" = "newData_"."title" from "newData_"
             where "post"."id" = "newData_"."id"`,
							parameters: ['Lorem', testUuid(1)],
							response: { rowCount: 1 },
						},
						{
							sql: SQL`insert into "public"."post_categories" ("post_id", "category_id")
              values (?, ?)
              on conflict do nothing`,
							parameters: [testUuid(1), testUuid(2)],
							response: 1,
						},
					]),
				],
				return: {
					data: {
						updateCategory: {
							ok: true,
						},
					},
				},
			})
		})

		it('upsert - exists', async () => {
			await execute({
				schema: postWithCategories,
				query: GQL`mutation {
        updateCategory(
            by: {id: "${testUuid(2)}"},
            data: {posts: [{upsert: {by: {id: "${testUuid(1)}"}, update: {title: "Lorem"}, create: {title: "Ipsum"}}}]}
          ) {
          ok
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "root_"."id" from "public"."category" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(2)],
							response: { rows: [{ id: testUuid(2) }] },
						},
						{
							sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(1)],
							response: { rows: [{ id: testUuid(1) }] },
						},
						{
							sql: SQL`with "newData_" as
              (select
                 ? :: text as "title",
                 "root_"."id"
               from "public"."post" as "root_"
               where "root_"."id" = ?) update "public"."post"
              set "title" = "newData_"."title" from "newData_"
             where "post"."id" = "newData_"."id"`,
							parameters: ['Lorem', testUuid(1)],
							response: { rowCount: 1 },
						},
						{
							sql: SQL`insert into "public"."post_categories" ("post_id", "category_id")
              values (?, ?)
              on conflict do nothing`,
							parameters: [testUuid(1), testUuid(2)],
							response: 1,
						},
					]),
				],
				return: {
					data: {
						updateCategory: {
							ok: true,
						},
					},
				},
			})
		})

		it('upsert - not exists', async () => {
			await execute({
				schema: postWithCategories,
				query: GQL`mutation {
        updateCategory(
            by: {id: "${testUuid(2)}"},
            data: {posts: [{upsert: {by: {id: "${testUuid(1)}"}, update: {title: "Lorem"}, create: {title: "Ipsum"}}}]}
          ) {
          ok
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "root_"."id" from "public"."category" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(2)],
							response: { rows: [{ id: testUuid(2) }] },
						},
						{
							sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(1)],
							response: { rows: [] },
						},
						{
							sql: SQL`with "root_" as
							(select ? :: uuid as "id", ? :: text as "title")
							insert into "public"."post" ("id", "title")
							select "root_"."id", "root_"."title"
              from "root_"
							returning "id"`,
							parameters: [testUuid(1), 'Ipsum'],
							response: { rows: [{ id: testUuid(1) }] },
						},
						{
							sql: SQL`insert into "public"."post_categories" ("post_id", "category_id")
              values (?, ?)
              on conflict do nothing`,
							parameters: [testUuid(1), testUuid(2)],
							response: 1,
						},
					]),
				],
				return: {
					data: {
						updateCategory: {
							ok: true,
						},
					},
				},
			})
		})
	})

	describe('acl', () => {
		it('update name', async () => {
			await execute({
				schema: new SchemaBuilder()
					.entity('Author', e => e.column('name', c => c.type(Model.ColumnType.String)))
					.buildSchema(),
				query: GQL`mutation {
        updateAuthor(
            by: {id: "${testUuid(1)}"},
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
							update: {
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
							sql: SQL`select "root_"."id" from "public"."author" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(1)],
							response: { rows: [{ id: testUuid(1) }] },
						},
						{
							sql: SQL`with "newData_" as
              (select
                 ? :: text as "name",
                 "root_"."id"
               from "public"."author" as "root_"
               where "root_"."id" = ? and "root_"."name" in (?, ?)) update "public"."author"
              set "name" = "newData_"."name" from "newData_"
              where "author"."id" = "newData_"."id" and "newData_"."name" in (?, ?)`,
							parameters: ['John', testUuid(1), 'John', 'Jack', 'John', 'Jack'],
							response: { rowCount: 1 },
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

		it('update name - denied', async () => {
			await execute({
				schema: new SchemaBuilder()
					.entity('Author', e => e.column('name', c => c.type(Model.ColumnType.String)))
					.buildSchema(),
				query: GQL`mutation {
        updateAuthor(
            by: {id: "${testUuid(1)}"},
            data: {name: "John"}
          ) {
          ok
        }
      }`,
				permissions: {
					Author: {
						predicates: {
							name_predicate: { name: { never: true } },
						},
						operations: {
							update: {
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
							sql: SQL`select "root_"."id" from "public"."author" as "root_" where "root_"."id" = ?`,
							parameters: [testUuid(1)],
							response: { rows: [{ id: testUuid(1) }] },
						},
						{
							sql: SQL`with "newData_" as
              (select
                 ? :: text as "name",
                 "root_"."id"
               from "public"."author" as "root_"
               where "root_"."id" = ? and false) update "public"."author"
              set "name" = "newData_"."name" from "newData_"
              where "author"."id" = "newData_"."id" and false`,
							parameters: ['John', testUuid(1)],
							response: 0,
						},
					]),
				],
				return: {
					data: {
						updateAuthor: {
							ok: false,
						},
					},
				},
			})
		})

		it('update m:n', async () => {
			await execute({
				schema: new SchemaBuilder()
					.entity('Post', e =>
						e
							.column('name', c => c.type(Model.ColumnType.String))
							.manyHasMany('categories', r =>
								r.target('Category', e => e.column('name', c => c.type(Model.ColumnType.String))).inversedBy('posts'),
							),
					)
					.buildSchema(),
				permissions: {
					Post: {
						predicates: {
							post_name_predicate: {
								name: 'post_name_variable',
							},
						},
						operations: {
							read: {
								id: true,
							},
							update: {
								id: true,
								categories: 'post_name_predicate',
							},
						},
					},
					Category: {
						predicates: {
							category_name_predicate: {
								name: 'category_name_variable',
							},
						},
						operations: {
							read: {
								id: true,
							},
							update: {
								posts: 'category_name_predicate',
							},
						},
					},
				},
				variables: {
					post_name_variable: ['Lorem ipsum', 'Dolor sit'],
					category_name_variable: ['foo', 'bar'],
				},
				query: GQL`mutation  {
          updatePost(by: {id: "${testUuid(1)}"}, data: {categories: [
						{connect: {id: "${testUuid(2)}"}},
						{disconnect: {id: "${testUuid(3)}"}},
          ]}) {
          ok
        }
				}`,
				executes: sqlTransaction([
					{
						sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?`,
						parameters: [testUuid(1)],
						response: { rows: [{ id: testUuid(1) }] },
					},
					{
						sql: SQL`select "root_"."id" from "public"."category" as "root_" where "root_"."id" = ?`,
						parameters: [testUuid(2)],
						response: { rows: [{ id: testUuid(2) }] },
					},
					{
						sql: SQL`with "data" as
            (select
               "owning"."id" as "post_id",
               "inversed"."id" as "category_id",
               true as "selected"
             from (values (null)) as "t" inner join "public"."post" as "owning" on true
               inner join "public"."category" as "inversed" on true
             where "owning"."name" in (?, ?) and "owning"."id" = ? and "inversed"."name" in (?, ?) and
                   "inversed"."id" = ?),
								"insert" as
              (insert into "public"."post_categories" ("post_id", "category_id")
                select
                  "data"."post_id",
                  "data"."category_id"
                from "data"
              on conflict do nothing
              returning true as inserted)
            select
              coalesce(data.selected, false) as "selected",
              coalesce(insert.inserted, false) as "inserted"
            from (values (null)) as "t" left join "data" as "data" on true
              left join "insert" as "insert" on true`,
						parameters: ['Lorem ipsum', 'Dolor sit', testUuid(1), 'foo', 'bar', testUuid(2)],
						response: {
							rows: [{ selected: true, inserted: true }],
						},
					},
					{
						sql: SQL`select "root_"."id" from "public"."category" as "root_" where "root_"."id" = ?`,
						parameters: [testUuid(3)],
						response: { rows: [{ id: testUuid(3) }] },
					},
					{
						sql: SQL`with "data" as
            (select
               "owning"."id" as "post_id",
               "inversed"."id" as "category_id",
               true as "selected"
             from (values (null)) as "t" inner join "public"."post" as "owning" on true
               inner join "public"."category" as "inversed" on true
             where "owning"."name" in (?, ?) and "owning"."id" = ? and "inversed"."name" in (?, ?) and
                   "inversed"."id" = ?),
                "delete" as
              (delete from "public"."post_categories"
              using "data" as "data"
              where "post_categories"."post_id" = "data"."post_id" and "post_categories"."category_id" = "data"."category_id"
              returning true as deleted)
            select
              coalesce(data.selected, false) as "selected",
              coalesce(delete.deleted, false) as "deleted"
            from (values (null)) as "t" left join "data" as "data" on true
              left join "delete" as "delete" on true`,
						parameters: ['Lorem ipsum', 'Dolor sit', testUuid(1), 'foo', 'bar', testUuid(3)],
						response: {
							rows: [{ selected: true, deleted: true }],
						},
					},
				]),
				return: {
					data: {
						updatePost: {
							ok: true,
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

	it('update book with validation - failed', async () => {
		//fixme
		return

		await execute({
			schema: bookSchema,
			validation: bookValidation,
			query: GQL`
          mutation {
              updateBook(by: {id: "${testUuid(1)}"}, data: {name: "", tags: [{connect: {id: "${testUuid(
				2,
			)}"}}, {disconnect: {id: "${testUuid(3)}"}}]}) {
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
			executes: [
				...sqlTransaction([
					{
						sql: SQL`select "root_"."name" as "root_name", "root_"."id" as "root_id", "root_"."id" as "root_id" from "public"."book" as "root_" where "root_"."id" = ?`,
						parameters: [testUuid(1)],
						response: {
							rows: [{ root_id: testUuid(1), name: 'John' }],
						},
					},
					{
						sql: SQL`select "root_"."book_id" as "__grouping_key", "root_"."id" as "root_id" from  "public"."tag" as "root_"   where "root_"."book_id" in (?)`,
						parameters: [testUuid(1)],
						response: {
							rows: [{ __grouping_key: testUuid(1), root_id: testUuid(3) }],
						},
					},
				]),
			],
			return: {
				data: {
					updateBook: {
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
										text: 'You have to fill at least two tags',
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

	it('executes in a transaction', async () => {
		await execute({
			schema: new SchemaBuilder()
				.entity('Author', e => e.column('name', c => c.type(Model.ColumnType.String)))
				.buildSchema(),
			query: GQL`mutation {
        transaction {
          ok
          updateAuthor(
              by: {id: "${testUuid(1)}"},
              data: {name: "John"}
            ) {
            ok
            author: node {
              id
            }
          }
          update2: updateAuthor(
              by: {id: "${testUuid(2)}"},
              data: {name: "Jack"}
            ) {
            ok
            author: node {
              id
            }
          }
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
						sql: SQL`with "newData_" as (select
                  ? :: text as "name",
                  "root_"."id"
                from "public"."author" as "root_"
                where "root_"."id" = ?) update "public"."author"
              set "name" = "newData_"."name" from "newData_"
              where "author"."id" = "newData_"."id"`,
						parameters: ['John', testUuid(1)],
						response: { rowCount: 1 },
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
					{
						sql: SQL`select "root_"."id" from "public"."author" as "root_" where "root_"."id" = ?`,
						parameters: [testUuid(2)],
						response: { rows: [{ id: testUuid(2) }] },
					},
					{
						sql: SQL`with "newData_" as (select
                  ? :: text as "name",
                  "root_"."id"
                from "public"."author" as "root_"
                where "root_"."id" = ?) update "public"."author"
              set "name" = "newData_"."name" from "newData_"
              where "author"."id" = "newData_"."id"`,
						parameters: ['Jack', testUuid(2)],
						response: { rowCount: 1 },
					},
					{
						sql: SQL`select "root_"."id" as "root_id"
                     from "public"."author" as "root_"
                     where "root_"."id" = ?`,
						response: {
							rows: [{ root_id: testUuid(2) }],
						},
						parameters: [testUuid(2)],
					},
				]),
			],
			return: {
				data: {
					transaction: {
						updateAuthor: {
							ok: true,
							author: {
								id: testUuid(1),
							},
						},
						update2: {
							ok: true,
							author: {
								id: testUuid(2),
							},
						},
						ok: true,
					},
				},
			},
		})
	})
})
