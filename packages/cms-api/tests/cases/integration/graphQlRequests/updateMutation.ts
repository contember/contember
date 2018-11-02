import { execute, sqlTransaction } from '../../../src/test'
import { Model } from 'cms-common'
import SchemaBuilder from '../../../../src/content-schema/builder/SchemaBuilder'
import { GQL, SQL } from '../../../src/tags'
import { testUuid } from '../../../src/testUuid'
import 'mocha'

describe('update', () => {
	const selectUpdatePostSql = {
		sql: SQL`select "root_"."id" as "root_id"
               from "public"."post" as "root_"
               where "root_"."id" = $1`,
		response: [{ root_id: testUuid(2) }],
		parameters: [testUuid(2)],
	}

	describe('columns (author)', () => {
		it('update "public".name', async () => {
			await execute({
				schema: new SchemaBuilder()
					.entity('Author', e => e.column('name', c => c.type(Model.ColumnType.String)))
					.buildSchema(),
				query: GQL`mutation {
        updateAuthor(
            by: {id: "${testUuid(1)}"},
            data: {name: "John"}
          ) {
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`with "newData_" as (select
                  $1 :: text as "name",
                  "root_"."id"
                from "public"."author" as "root_"
                where "root_"."id" = $2) update "public"."author"
              set "name" = "newData_"."name" from "newData_"
              where "author"."id" = $3`,
							parameters: ['John', testUuid(1), testUuid(1)],
							response: { rowCount: 1 },
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
						updateAuthor: {
							id: testUuid(1),
						},
					},
				},
			})
		})
	})

	describe('many has one (post and author)', () => {
		const postWithAuthor = new SchemaBuilder()
			.entity('Post', e =>
				e
					.manyHasOne('author', r =>
						r
							.target('Author')
							.notNull()
							.inversedBy('posts')
					)
					.column('title', c => c.type(Model.ColumnType.String))
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
							sql: SQL`with "newData_" as
              (select
                 $1 :: uuid as "author_id",
                 "root_"."id",
                 "root_"."title"
               from "public"."post" as "root_"
               where "root_"."id" = $2) update "public"."post"
              set "author_id" = "newData_"."author_id" from "newData_"
              where "post"."id" = $3`,
							parameters: [testUuid(1), testUuid(2), testUuid(2)],
							response: { rowCount: 1 },
						},
						selectUpdatePostSql,
					]),
				],
				return: {
					data: {
						updatePost: {
							id: testUuid(2),
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
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`with "newData_" as
              (select
                 $1 :: uuid as "author_id",
                 "root_"."id",
                 "root_"."title"
               from "public"."post" as "root_"
               where "root_"."id" = $2) update "public"."post"
              set "author_id" = "newData_"."author_id" from "newData_"
              where "post"."id" = $3`,
							parameters: [testUuid(1), testUuid(2), testUuid(2)],
							response: { rowCount: 1 },
						},
						selectUpdatePostSql,
					]),
				],
				return: {
					data: {
						updatePost: {
							id: testUuid(2),
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
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "root_"."author_id"
                       from "public"."post" as "root_"
                       where "root_"."id" = $1`,
							parameters: [testUuid(2)],
							response: [{ author_id: testUuid(1) }],
						},
						{
							sql: SQL`with "newData_" as
              (select
                 $1 :: text as "name",
                 "root_"."id"
               from "public"."author" as "root_"
               where "root_"."id" = $2) update "public"."author"
              set "name" = "newData_"."name" from "newData_"
              where "author"."id" = $3`,
							parameters: ['John', testUuid(1), testUuid(1)],
							response: { rowCount: 1 },
						},
						selectUpdatePostSql,
					]),
				],
				return: {
					data: {
						updatePost: {
							id: testUuid(2),
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
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "root_"."author_id"
                       from "public"."post" as "root_"
                       where "root_"."id" = $1`,
							parameters: [testUuid(2)],
							response: [{ author_id: testUuid(1) }],
						},
						{
							sql: SQL`with "newData_" as (select
                                             $1 :: text as "name",
                                             "root_"."id"
                                           from "public"."author" as "root_"
                                           where "root_"."id" = $2) update "public"."author"
              set "name" = "newData_"."name" from "newData_"
              where "author"."id" = $3`,
							parameters: ['Jack', testUuid(1), testUuid(1)],
							response: { rowCount: 1 },
						},
						selectUpdatePostSql,
					]),
				],
				return: {
					data: {
						updatePost: {
							id: testUuid(2),
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
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "root_"."author_id"
                       from "public"."post" as "root_"
                       where "root_"."id" = $1`,
							parameters: [testUuid(2)],
							response: [],
						},
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
							sql: SQL`with "newData_" as
              (select
                 $1 :: uuid as "author_id",
                 "root_"."id",
                 "root_"."title"
               from "public"."post" as "root_"
               where "root_"."id" = $2) update "public"."post"
              set "author_id" = "newData_"."author_id" from "newData_"
              where "post"."id" = $3`,
							parameters: [testUuid(1), testUuid(2), testUuid(2)],
							response: { rowCount: 1 },
						},
						selectUpdatePostSql,
					]),
				],
				return: {
					data: {
						updatePost: {
							id: testUuid(2),
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
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`with "newData_" as
              (select
                 $1 :: uuid as "author_id",
                 "root_"."id"
               from "public"."post" as "root_"
               where "root_"."id" = $2) update "public"."post"
              set "author_id" = "newData_"."author_id" from "newData_"
              where "post"."id" = $3`,
							parameters: [null, testUuid(2), testUuid(2)],
							response: { rowCount: 1 },
						},
						selectUpdatePostSql,
					]),
				],
				return: {
					data: {
						updatePost: {
							id: testUuid(2),
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
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "root_"."author_id"
                       from "public"."post" as "root_"
                       where "root_"."id" = $1`,
							parameters: [testUuid(2)],
							response: [{ author_id: testUuid(1) }],
						},
						{
							sql: SQL`with "newData_" as
              (select
                 $1 :: uuid as "author_id",
                 "root_"."id"
               from "public"."post" as "root_"
               where "root_"."id" = $2) update "public"."post"
              set "author_id" = "newData_"."author_id" from "newData_"
              where "post"."id" = $3`,
							parameters: [null, testUuid(2), testUuid(2)],
							response: { rowCount: 1 },
						},
						{
							sql: SQL`delete from "public"."author"
              where "id" in (select "root_"."id"
                             from "public"."author" as "root_"
                             where "root_"."id" = $1)`,
							parameters: [testUuid(1)],
							response: 1,
						},
						selectUpdatePostSql,
					]),
				],
				return: {
					data: {
						updatePost: {
							id: testUuid(2),
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
							.column('locale', c => c.type(Model.ColumnType.String))
					)
				)
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
								.column('locale', c => c.type(Model.ColumnType.String))
						)
				)
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
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`with "root_" as 
							(select $1 :: uuid as "id", $2 :: text as "title", $3 :: text as "locale", $4 :: uuid as "post_id") 
							insert into "public"."post_locale" ("id", "title", "locale", "post_id") 
							select "root_"."id", "root_"."title", "root_"."locale", "root_"."post_id"
              from "root_"
							returning "id"`,
							parameters: [testUuid(1), 'Hello', 'cs', testUuid(2)],
							response: { rows: [{ id: testUuid(1) }] },
						},
						selectUpdatePostSql,
					]),
				],
				return: {
					data: {
						updatePost: {
							id: testUuid(2),
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
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "root_"."id"
                       from "public"."post_locale" as "root_"
                       where "root_"."locale" = $1 and "root_"."post_id" = $2`,
							parameters: ['cs', testUuid(2)],
							response: [{ id: testUuid(1) }],
						},
						{
							sql: SQL`with "newData_" as
              (select
                 $1 :: text as "title",
                 "root_"."id",
                 "root_"."locale",
                 "root_"."post_id"
               from "public"."post_locale" as "root_"
               where "root_"."locale" = $2 and "root_"."post_id" = $3) update "public"."post_locale"
              set "title" = "newData_"."title" from "newData_"
              where "post_locale"."locale" = $4 and "post_locale"."post_id" = $5`,
							parameters: ['Hello', 'cs', testUuid(2), 'cs', testUuid(2)],
							response: { rowCount: 1 },
						},
						selectUpdatePostSql,
					]),
				],
				return: {
					data: {
						updatePost: {
							id: testUuid(2),
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
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "root_"."id"
                       from "public"."post_locale" as "root_"
                       where "root_"."locale" = $1 and "root_"."post_id" = $2`,
							parameters: ['cs', testUuid(2)],
							response: [{ id: testUuid(1) }],
						},
						{
							sql: SQL`with "newData_" as
              (select
                 $1 :: text as "title",
                 "root_"."id",
                 "root_"."locale",
                 "root_"."post_id"
               from "public"."post_locale" as "root_"
               where "root_"."locale" = $2 and "root_"."post_id" = $3) 
							update "public"."post_locale"
              set "title" = "newData_"."title" from "newData_"
              where "post_locale"."locale" = $4 and "post_locale"."post_id" = $5`,
							parameters: ['Hello', 'cs', testUuid(2), 'cs', testUuid(2)],
							response: { rowCount: 1 },
						},
						selectUpdatePostSql,
					]),
				],
				return: {
					data: {
						updatePost: {
							id: testUuid(2),
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
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "root_"."id"
                       from "public"."post_locale" as "root_"
                       where "root_"."locale" = $1 and "root_"."post_id" = $2`,
							parameters: ['cs', testUuid(2)],
							response: [],
						},
						{
							sql: SQL`with "root_" as 
							(select $1 :: uuid as "id", $2 :: text as "title", $3 :: text as "locale", $4 :: uuid as "post_id") 
							insert into "public"."post_locale" ("id", "title", "locale", "post_id") 
							select "root_"."id", "root_"."title", "root_"."locale", "root_"."post_id"
              from "root_"
							returning "id"`,
							parameters: [testUuid(1), 'World', 'cs', testUuid(2)],
							response: { rows: [{ id: testUuid(1) }] },
						},
						selectUpdatePostSql,
					]),
				],
				return: {
					data: {
						updatePost: {
							id: testUuid(2),
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
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`delete from "public"."post_locale"
              where "id" in (select "root_"."id"
                             from "public"."post_locale" as "root_"
                             where "root_"."locale" = $1 and "root_"."post_id" = $2)`,
							parameters: ['cs', testUuid(2)],
							response: 1,
						},
						selectUpdatePostSql,
					]),
				],
				return: {
					data: {
						updatePost: {
							id: testUuid(2),
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
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`with "newData_" as
              (select
                 $1 :: uuid as "post_id",
                 "root_"."id",
                 "root_"."title",
                 "root_"."locale"
               from "public"."post_locale" as "root_"
               where "root_"."id" = $2) update "public"."post_locale"
              set "post_id" = "newData_"."post_id" from "newData_"
              where "post_locale"."id" = $3`,
							parameters: [testUuid(2), testUuid(1), testUuid(1)],
							response: { rowCount: 1 },
						},
						selectUpdatePostSql,
					]),
				],
				return: {
					data: {
						updatePost: {
							id: testUuid(2),
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
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`with "newData_" as
              (select
                 $1 :: uuid as "post_id",
                 "root_"."id",
                 "root_"."title",
                 "root_"."locale"
               from "public"."post_locale" as "root_"
               where "root_"."id" = $2 and "root_"."post_id" = $3) update "public"."post_locale"
              set "post_id" = "newData_"."post_id" from "newData_"
              where "post_locale"."id" = $4 and "post_locale"."post_id" = $5`,
							parameters: [null, testUuid(1), testUuid(2), testUuid(1), testUuid(2)],
							response: { rowCount: 1 },
						},
						selectUpdatePostSql,
					]),
				],
				return: {
					data: {
						updatePost: {
							id: testUuid(2),
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
					r.inversedBy('site').target('SiteSetting', e => e.column('url', c => c.type(Model.ColumnType.String)))
				)
		)
		.buildSchema()

	describe('one has one owner (site and setting)', () => {
		const selectUpdateSiteSql = {
			sql: SQL`select "root_"."id" as "root_id"
               from "public"."site" as "root_"
               where "root_"."id" = $1`,
			response: [{ root_id: testUuid(2) }],
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
							parameters: [testUuid(1), 'http://mangoweb.cz'],
							response: { rows: [{ id: testUuid(1) }] },
						},
						{
							sql: SQL`with "newData_" as
              (select
                 $1 :: uuid as "setting_id",
                 "root_"."id",
                 "root_"."name"
               from "public"."site" as "root_"
               where "root_"."id" = $2) update "public"."site"
              set "setting_id" = "newData_"."setting_id" from "newData_"
              where "site"."id" = $3`,
							parameters: [testUuid(1), testUuid(2), testUuid(2)],
							response: { rowCount: 1 },
						},
						selectUpdateSiteSql,
					]),
				],
				return: {
					data: {
						updateSite: {
							id: testUuid(2),
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
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "root_"."setting_id"
                       from "public"."site" as "root_"
                       where "root_"."id" = $1`,
							parameters: [testUuid(2)],
							response: [{ setting_id: testUuid(1) }],
						},
						{
							sql: SQL`with "newData_" as
              (select
                 $1 :: text as "url",
                 "root_"."id"
               from "public"."site_setting" as "root_"
               where "root_"."id" = $2) update "public"."site_setting"
              set "url" = "newData_"."url" from "newData_"
              where "site_setting"."id" = $3`,
							parameters: ['http://mangoweb.cz', testUuid(1), testUuid(1)],
							response: { rowCount: 1 },
						},
						selectUpdateSiteSql,
					]),
				],
				return: {
					data: {
						updateSite: {
							id: testUuid(2),
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
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "root_"."id"
                       from "public"."site" as "root_"
                       where "root_"."setting_id" = $1`,
							parameters: [testUuid(1)],
							response: [{ id: testUuid(2) }],
						},
						selectUpdateSiteSql,
					]),
				],
				return: {
					data: {
						updateSite: {
							id: testUuid(2),
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
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "root_"."id"
                       from "public"."site" as "root_"
                       where "root_"."setting_id" = $1`,
							parameters: [testUuid(1)],
							response: [],
						},
						{
							sql: SQL`with "newData_" as
              (select
                 $1 :: uuid as "setting_id",
                 "root_"."id",
                 "root_"."name"
               from "public"."site" as "root_"
               where "root_"."id" = $2) update "public"."site"
              set "setting_id" = "newData_"."setting_id" from "newData_"
              where "site"."id" = $3`,
							parameters: [testUuid(1), testUuid(2), testUuid(2)],
							response: { rowCount: 1 },
						},
						selectUpdateSiteSql,
					]),
				],
				return: {
					data: {
						updateSite: {
							id: testUuid(2),
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
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "root_"."id"
                       from "public"."site" as "root_"
                       where "root_"."setting_id" = $1`,
							parameters: [testUuid(1)],
							response: [{ id: testUuid(3) }],
						},
						{
							sql: SQL`with "newData_" as
              (select
                 $1 :: uuid as "setting_id",
                 "root_"."id",
                 "root_"."name"
               from "public"."site" as "root_"
               where "root_"."id" = $2) update "public"."site"
              set "setting_id" = "newData_"."setting_id" from "newData_"
              where "site"."id" = $3`,
							parameters: [null, testUuid(3), testUuid(3)],
							response: { rowCount: 1 },
						},
						{
							sql: SQL`with "newData_" as
              (select
                 $1 :: uuid as "setting_id",
                 "root_"."id",
                 "root_"."name"
               from "public"."site" as "root_"
               where "root_"."id" = $2) update "public"."site"
              set "setting_id" = "newData_"."setting_id" from "newData_"
              where "site"."id" = $3`,
							parameters: [testUuid(1), testUuid(2), testUuid(2)],
							response: { rowCount: 1 },
						},
						selectUpdateSiteSql,
					]),
				],
				return: {
					data: {
						updateSite: {
							id: testUuid(2),
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
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "root_"."setting_id"
                       from "public"."site" as "root_"
                       where "root_"."id" = $1`,
							parameters: [testUuid(2)],
							response: [{ setting_id: testUuid(1) }],
						},
						{
							sql: SQL`with "newData_" as
              (select
                 $1 :: text as "url",
                 "root_"."id"
               from "public"."site_setting" as "root_"
               where "root_"."id" = $2) update "public"."site_setting"
              set "url" = "newData_"."url" from "newData_"
              where "site_setting"."id" = $3`,
							parameters: ['http://mangoweb.cz', testUuid(1), testUuid(1)],
							response: { rowCount: 1 },
						},
						selectUpdateSiteSql,
					]),
				],
				return: {
					data: {
						updateSite: {
							id: testUuid(2),
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
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "root_"."setting_id"
                       from "public"."site" as "root_"
                       where "root_"."id" = $1`,
							parameters: [testUuid(2)],
							response: [],
						},
						{
							sql: SQL`with "root_" as 
							(select $1 :: uuid as "id", $2 :: text as "url") 
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
                 $1 :: uuid as "setting_id",
                 "root_"."id",
                 "root_"."name"
               from "public"."site" as "root_"
               where "root_"."id" = $2) update "public"."site"
              set "setting_id" = "newData_"."setting_id" from "newData_"
              where "site"."id" = $3`,
							parameters: [testUuid(1), testUuid(2), testUuid(2)],
							response: { rowCount: 1 },
						},
						selectUpdateSiteSql,
					]),
				],
				return: {
					data: {
						updateSite: {
							id: testUuid(2),
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
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`with "newData_" as
              (select
                 $1 :: uuid as "setting_id",
                 "root_"."id",
                 "root_"."name"
               from "public"."site" as "root_"
               where "root_"."id" = $2) update "public"."site"
              set "setting_id" = "newData_"."setting_id" from "newData_"
              where "site"."id" = $3`,
							parameters: [null, testUuid(2), testUuid(2)],
							response: { rowCount: 1 },
						},
						selectUpdateSiteSql,
					]),
				],
				return: {
					data: {
						updateSite: {
							id: testUuid(2),
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
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "root_"."setting_id"
                       from "public"."site" as "root_"
                       where "root_"."id" = $1`,
							parameters: [testUuid(2)],
							response: [{ setting_id: testUuid(1) }],
						},
						{
							sql: SQL`with "newData_" as
              (select
                 $1 :: uuid as "setting_id",
                 "root_"."id",
                 "root_"."name"
               from "public"."site" as "root_"
               where "root_"."id" = $2) update "public"."site"
              set "setting_id" = "newData_"."setting_id" from "newData_"
              where "site"."id" = $3`,
							parameters: [null, testUuid(2), testUuid(2)],
							response: { rowCount: 1 },
						},
						{
							sql: SQL`delete from "public"."site_setting"
              where "id" in (select "root_"."id"
                             from "public"."site_setting" as "root_"
                             where "root_"."id" = $1)`,
							parameters: [testUuid(1)],
							response: 1,
						},
						selectUpdateSiteSql,
					]),
				],
				return: {
					data: {
						updateSite: {
							id: testUuid(2),
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
               where "root_"."id" = $1`,
			response: [{ root_id: testUuid(2) }],
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
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "root_"."id"
                       from "public"."site" as "root_"
                       where "root_"."setting_id" = $1`,
							parameters: [testUuid(2)],
							response: [{ id: testUuid(3) }],
						},
						{
							sql: SQL`with "newData_" as
              (select
                 $1 :: uuid as "setting_id",
                 "root_"."id",
                 "root_"."name"
               from "public"."site" as "root_"
               where "root_"."setting_id" = $2) update "public"."site"
              set "setting_id" = "newData_"."setting_id" from "newData_"
              where "site"."setting_id" = $3`,
							parameters: [null, testUuid(2), testUuid(2)],
							response: { rowCount: 1 },
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
						selectUpdateSiteSettingSql,
					]),
				],
				return: {
					data: {
						updateSiteSetting: {
							id: testUuid(2),
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
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "root_"."id"
                       from "public"."site" as "root_"
                       where "root_"."setting_id" = $1`,
							parameters: [testUuid(2)],
							response: [],
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
						selectUpdateSiteSettingSql,
					]),
				],
				return: {
					data: {
						updateSiteSetting: {
							id: testUuid(2),
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
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "root_"."id"
                       from "public"."site" as "root_"
                       where "root_"."setting_id" = $1`,
							parameters: [testUuid(2)],
							response: [{ id: testUuid(1) }],
						},
						{
							sql: SQL`with "newData_" as
              (select
                 $1 :: text as "name",
                 "root_"."id",
                 "root_"."setting_id"
               from "public"."site" as "root_"
               where "root_"."setting_id" = $2) update "public"."site"
              set "name" = "newData_"."name" from "newData_"
              where "site"."setting_id" = $3`,
							parameters: ['Mangoweb', testUuid(2), testUuid(2)],
							response: { rowCount: 1 },
						},
						selectUpdateSiteSettingSql,
					]),
				],
				return: {
					data: {
						updateSiteSetting: {
							id: testUuid(2),
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
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "root_"."id"
                       from "public"."site" as "root_"
                       where "root_"."setting_id" = $1`,
							parameters: [testUuid(2)],
							response: [{ id: testUuid(1) }],
						},
						{
							sql: SQL`with "newData_" as
              (select
                 $1 :: text as "name",
                 "root_"."id",
                 "root_"."setting_id"
               from "public"."site" as "root_"
               where "root_"."setting_id" = $2) update "public"."site"
              set "name" = "newData_"."name" from "newData_"
              where "site"."setting_id" = $3`,
							parameters: ['Mangoweb', testUuid(2), testUuid(2)],
							response: { rowCount: 1 },
						},
						selectUpdateSiteSettingSql,
					]),
				],
				return: {
					data: {
						updateSiteSetting: {
							id: testUuid(2),
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
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "root_"."id"
                       from "public"."site" as "root_"
                       where "root_"."setting_id" = $1`,
							parameters: [testUuid(2)],
							response: [],
						},
						{
							sql: SQL`with "root_" as 
							(select $1 :: uuid as "id", $2 :: text as "name", $3 :: uuid as "setting_id") 
							insert into "public"."site" ("id", "name", "setting_id") 
							select "root_"."id", "root_"."name", "root_"."setting_id"
              from "root_"
							returning "id"`,
							parameters: [testUuid(1), 'Mgw', testUuid(2)],
							response: { rows: [{ id: testUuid(1) }] },
						},
						selectUpdateSiteSettingSql,
					]),
				],
				return: {
					data: {
						updateSiteSetting: {
							id: testUuid(2),
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
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "root_"."id"
                       from "public"."site" as "root_"
                       where "root_"."setting_id" = $1`,
							parameters: [testUuid(2)],
							response: [{ id: testUuid(1) }],
						},
						{
							sql: SQL`with "newData_" as
              (select
                 $1 :: uuid as "setting_id",
                 "root_"."id",
                 "root_"."name"
               from "public"."site" as "root_"
               where "root_"."setting_id" = $2) update "public"."site"
              set "setting_id" = "newData_"."setting_id" from "newData_"
              where "site"."setting_id" = $3`,
							parameters: [null, testUuid(2), testUuid(2)],
							response: { rowCount: 1 },
						},
						selectUpdateSiteSettingSql,
					]),
				],
				return: {
					data: {
						updateSiteSetting: {
							id: testUuid(2),
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
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`delete from "public"."site"
              where "id" in (select "root_"."id"
                             from "public"."site" as "root_"
                             where "root_"."setting_id" = $1)`,
							parameters: [testUuid(2)],
							response: 1,
						},
						selectUpdateSiteSettingSql,
					]),
				],
				return: {
					data: {
						updateSiteSetting: {
							id: testUuid(2),
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
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "root_"."id"
                       from "public"."site" as "root_"
                       where "root_"."setting_id" = $1`,
							parameters: [testUuid(2)],
							response: [{ id: testUuid(1) }],
						},
						selectUpdateSiteSettingSql,
					]),
				],
				return: {
					data: {
						updateSiteSetting: {
							id: testUuid(2),
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
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "root_"."id"
                       from "public"."site" as "root_"
                       where "root_"."setting_id" = $1`,
							parameters: [testUuid(2)],
							response: [],
						},
						{
							sql: SQL`with "newData_" as
              (select
                 $1 :: uuid as "setting_id",
                 "root_"."id",
                 "root_"."name"
               from "public"."site" as "root_"
               where "root_"."id" = $2) update "public"."site"
              set "setting_id" = "newData_"."setting_id" from "newData_"
              where "site"."id" = $3`,
							parameters: [testUuid(2), testUuid(1), testUuid(1)],
							response: { rowCount: 1 },
						},
						selectUpdateSiteSettingSql,
					]),
				],
				return: {
					data: {
						updateSiteSetting: {
							id: testUuid(2),
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
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "root_"."id"
                       from "public"."site" as "root_"
                       where "root_"."setting_id" = $1`,
							parameters: [testUuid(2)],
							response: [{ id: testUuid(3) }],
						},
						{
							sql: SQL`with "newData_" as
              (select
                 $1 :: uuid as "setting_id",
                 "root_"."id",
                 "root_"."name"
               from "public"."site" as "root_"
               where "root_"."id" = $2) update "public"."site"
              set "setting_id" = "newData_"."setting_id" from "newData_"
              where "site"."id" = $3`,
							parameters: [null, testUuid(3), testUuid(3)],
							response: { rowCount: 1 },
						},
						{
							sql: SQL`with "newData_" as
              (select
                 $1 :: uuid as "setting_id",
                 "root_"."id",
                 "root_"."name"
               from "public"."site" as "root_"
               where "root_"."id" = $2) update "public"."site"
              set "setting_id" = "newData_"."setting_id" from "newData_"
              where "site"."id" = $3`,
							parameters: [testUuid(2), testUuid(1), testUuid(1)],
							response: { rowCount: 1 },
						},
						selectUpdateSiteSettingSql,
					]),
				],
				return: {
					data: {
						updateSiteSetting: {
							id: testUuid(2),
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
				.column('title', c => c.type(Model.ColumnType.String))
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
            data: {categories: [{connect: {id: "${testUuid(1)}"}}]}
          ) {
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`insert into "public"."post_categories" ("category_id", "post_id")
              values ($1, $2)
              on conflict do nothing`,
							parameters: [testUuid(1), testUuid(2)],
							response: { rowCount: 1 },
						},
						selectUpdatePostSql,
					]),
				],
				return: {
					data: {
						updatePost: {
							id: testUuid(2),
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
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`with "root_" as 
							(select $1 :: uuid as "id", $2 :: text as "name") 
							insert into "public"."category" ("id", "name") 
							select "root_"."id", "root_"."name"
              from "root_"
							returning "id"`,
							parameters: [testUuid(1), 'Lorem'],
							response: { rows: [{ id: testUuid(1) }] },
						},
						{
							sql: SQL`insert into "public"."post_categories" ("category_id", "post_id")
              values ($1, $2)
              on conflict do nothing`,
							parameters: [testUuid(1), testUuid(2)],
							response: { rowCount: 1 },
						},
						selectUpdatePostSql,
					]),
				],
				return: {
					data: {
						updatePost: {
							id: testUuid(2),
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
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`delete from "public"."post_categories"
              where "post_id" = $1 and "category_id" = $2`,
							parameters: [testUuid(2), testUuid(1)],
							response: 1,
						},
						{
							sql: SQL`delete from "public"."category"
              where "id" in (select "root_"."id"
                             from "public"."category" as "root_"
                             where "root_"."id" = $1)`,
							parameters: [testUuid(1)],
							response: 1,
						},
						selectUpdatePostSql,
					]),
				],
				return: {
					data: {
						updatePost: {
							id: testUuid(2),
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
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`delete from "public"."post_categories"
              where "post_id" = $1 and "category_id" = $2`,
							parameters: [testUuid(2), testUuid(1)],
							response: { rowCount: 1 },
						},
						selectUpdatePostSql,
					]),
				],
				return: {
					data: {
						updatePost: {
							id: testUuid(2),
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
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`with "newData_" as
              (select
                 $1 :: text as "name",
                 "root_"."id"
               from "public"."category" as "root_"
               where "root_"."id" = $2) update "public"."category"
              set "name" = "newData_"."name" from "newData_"
              where "category"."id" = $3`,
							parameters: ['Lorem', testUuid(1), testUuid(1)],
							response: { rowCount: 1 },
						},
						{
							sql: SQL`insert into "public"."post_categories" ("category_id", "post_id")
              values ($1, $2)
              on conflict do nothing`,
							parameters: [testUuid(1), testUuid(2)],
							response: { rowCount: 1 },
						},
						selectUpdatePostSql,
					]),
				],
				return: {
					data: {
						updatePost: {
							id: testUuid(2),
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
							1
						)}"}, update: {name: "Lorem"}, create: {name: "Ipsum"}}}]}
          ) {
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`with "newData_" as
              (select
                 $1 :: text as "name",
                 "root_"."id"
               from "public"."category" as "root_"
               where "root_"."id" = $2) update "public"."category"
              set "name" = "newData_"."name" from "newData_"
              where "category"."id" = $3`,
							parameters: ['Lorem', testUuid(1), testUuid(1)],
							response: { rowCount: 1 },
						},
						{
							sql: SQL`insert into "public"."post_categories" ("category_id", "post_id")
              values ($1, $2)
              on conflict do nothing`,
							parameters: [testUuid(1), testUuid(2)],
							response: 1,
						},
						selectUpdatePostSql,
					]),
				],
				return: {
					data: {
						updatePost: {
							id: testUuid(2),
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
							1
						)}"}, update: {name: "Lorem"}, create: {name: "Ipsum"}}}]}
          ) {
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`with "newData_" as
              (select
                 $1 :: text as "name",
                 "root_"."id"
               from "public"."category" as "root_"
               where "root_"."id" = $2) update "public"."category"
              set "name" = "newData_"."name" from "newData_"
              where "category"."id" = $3`,
							parameters: ['Lorem', testUuid(1), testUuid(1)],
							response: 0,
						},
						{
							sql: SQL`with "root_" as 
							(select $1 :: uuid as "id", $2 :: text as "name") 
							insert into "public"."category" ("id", "name") 
							select "root_"."id", "root_"."name"
              from "root_"
							returning "id"`,
							parameters: [testUuid(1), 'Ipsum'],
							response: { rows: [{ id: testUuid(1) }] },
						},
						{
							sql: SQL`insert into "public"."post_categories" ("category_id", "post_id")
              values ($1, $2)
              on conflict do nothing`,
							parameters: [testUuid(1), testUuid(2)],
							response: 1,
						},
						selectUpdatePostSql,
					]),
				],
				return: {
					data: {
						updatePost: {
							id: testUuid(2),
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
               where "root_"."id" = $1`,
			response: [{ root_id: testUuid(2) }],
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
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`insert into "public"."post_categories" ("category_id", "post_id") 
							values ($1, $2)
              on conflict do nothing`,
							parameters: [testUuid(2), testUuid(1)],
							response: 1,
						},
						selectUpdateCategorySql,
					]),
				],
				return: {
					data: {
						updateCategory: {
							id: testUuid(2),
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
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`with "root_" as 
							(select $1 :: uuid as "id", $2 :: text as "title") 
							insert into "public"."post" ("id", "title") 
							select "root_"."id", "root_"."title"
              from "root_"
							returning "id"`,
							parameters: [testUuid(1), 'Lorem'],
							response: { rows: [{ id: testUuid(1) }] },
						},
						{
							sql: SQL`insert into "public"."post_categories" ("category_id", "post_id")
              values ($1, $2)
              on conflict do nothing`,
							parameters: [testUuid(2), testUuid(1)],
							response: 1,
						},
						selectUpdateCategorySql,
					]),
				],
				return: {
					data: {
						updateCategory: {
							id: testUuid(2),
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
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`delete from "public"."post_categories"
              where "post_id" = $1 and "category_id" = $2`,
							parameters: [testUuid(1), testUuid(2)],
							response: 1,
						},
						{
							sql: SQL`delete from "public"."post"
              where "id" in (select "root_"."id"
                             from "public"."post" as "root_"
                             where "root_"."id" = $1)`,
							parameters: [testUuid(1)],
							response: 1,
						},
						selectUpdateCategorySql,
					]),
				],
				return: {
					data: {
						updateCategory: {
							id: testUuid(2),
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
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`delete from "public"."post_categories"
              where "post_id" = $1 and "category_id" = $2`,
							parameters: [testUuid(1), testUuid(2)],
							response: 1,
						},
						selectUpdateCategorySql,
					]),
				],
				return: {
					data: {
						updateCategory: {
							id: testUuid(2),
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
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`with "newData_" as
              (select
                 $1 :: text as "title",
                 "root_"."id"
               from "public"."post" as "root_"
               where "root_"."id" = $2) update "public"."post"
              set "title" = "newData_"."title" from "newData_"
              where "post"."id" = $3`,
							parameters: ['Lorem', testUuid(1), testUuid(1)],
							response: { rowCount: 1 },
						},
						{
							sql: SQL`insert into "public"."post_categories" ("category_id", "post_id")
              values ($1, $2)
              on conflict do nothing`,
							parameters: [testUuid(2), testUuid(1)],
							response: 1,
						},
						selectUpdateCategorySql,
					]),
				],
				return: {
					data: {
						updateCategory: {
							id: testUuid(2),
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
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`with "newData_" as
              (select
                 $1 :: text as "title",
                 "root_"."id"
               from "public"."post" as "root_"
               where "root_"."id" = $2) update "public"."post"
              set "title" = "newData_"."title" from "newData_"
              where "post"."id" = $3`,
							parameters: ['Lorem', testUuid(1), testUuid(1)],
							response: { rowCount: 1 },
						},
						{
							sql: SQL`insert into "public"."post_categories" ("category_id", "post_id")
              values ($1, $2)
              on conflict do nothing`,
							parameters: [testUuid(2), testUuid(1)],
							response: 1,
						},
						selectUpdateCategorySql,
					]),
				],
				return: {
					data: {
						updateCategory: {
							id: testUuid(2),
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
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`with "newData_" as
              (select
                 $1 :: text as "title",
                 "root_"."id"
               from "public"."post" as "root_"
               where "root_"."id" = $2) update "public"."post"
              set "title" = "newData_"."title" from "newData_"
              where "post"."id" = $3`,
							parameters: ['Lorem', testUuid(1), testUuid(1)],
							response: 0,
						},
						{
							sql: SQL`with "root_" as 
							(select $1 :: uuid as "id", $2 :: text as "title") 
							insert into "public"."post" ("id", "title") 
							select "root_"."id", "root_"."title"
              from "root_"
							returning "id"`,
							parameters: [testUuid(1), 'Ipsum'],
							response: { rows: [{ id: testUuid(1) }] },
						},
						{
							sql: SQL`insert into "public"."post_categories" ("category_id", "post_id")
              values ($1, $2)
              on conflict do nothing`,
							parameters: [testUuid(2), testUuid(1)],
							response: 1,
						},
						selectUpdateCategorySql,
					]),
				],
				return: {
					data: {
						updateCategory: {
							id: testUuid(2),
						},
					},
				},
			})
		})
	})

	describe('acl', () => {
		it('update "public".name', async () => {
			await execute({
				schema: new SchemaBuilder()
					.entity('Author', e => e.column('name', c => c.type(Model.ColumnType.String)))
					.buildSchema(),
				query: GQL`mutation {
        updateAuthor(
            by: {id: "${testUuid(1)}"},
            data: {name: "John"}
          ) {
          id
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
							sql: SQL`with "newData_" as
              (select
                 $1 :: text as "name",
                 "root_"."id"
               from "public"."author" as "root_"
               where "root_"."id" = $2) update "public"."author"
              set "name" = "newData_"."name" from "newData_"
              where "author"."id" = $3 and "author"."name" in ($4, $5) and "newData_"."name" in ($6, $7)`,
							parameters: ['John', testUuid(1), testUuid(1), 'John', 'Jack', 'John', 'Jack'],
							response: { rowCount: 1 },
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
						updateAuthor: {
							id: testUuid(1),
						},
					},
				},
			})
		})

		it('update "public".name - denied', async () => {
			await execute({
				schema: new SchemaBuilder()
					.entity('Author', e => e.column('name', c => c.type(Model.ColumnType.String)))
					.buildSchema(),
				query: GQL`mutation {
        updateAuthor(
            by: {id: "${testUuid(1)}"},
            data: {name: "John"}
          ) {
          id
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
					...sqlTransaction([
						{
							sql: SQL`with "newData_" as
              (select
                 $1 :: text as "name",
                 "root_"."id"
               from "public"."author" as "root_"
               where "root_"."id" = $2) update "public"."author"
              set "name" = "newData_"."name" from "newData_"
              where "author"."id" = $3 and false and false`,
							parameters: ['John', testUuid(1), testUuid(1)],
							response: 0,
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
						updateAuthor: null,
					},
					errors: [
						{
							locations: [
								{
									column: 9,
									line: 2,
								},
							],
							message: 'Mutation failed, operation denied by ACL rules',
							path: ['updateAuthor'],
						},
					],
				},
			})
		})

		it('update "public".m:n', async () => {
			await execute({
				schema: new SchemaBuilder()
					.entity('Post', e =>
						e
							.column('name', c => c.type(Model.ColumnType.String))
							.manyHasMany('categories', r =>
								r.target('Category', e => e.column('name', c => c.type(Model.ColumnType.String))).inversedBy('posts')
							)
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
            id
          }	
				}`,
				executes: sqlTransaction([
					{
						sql: SQL`with "data" as
            (select
               "owning"."id" as "post_id",
               "inversed"."id" as "category_id",
               true as "selected"
             from (values (null)) as "t" inner join "public"."post" as "owning" on true
               inner join "public"."category" as "inversed" on true
             where "owning"."name" in ($1, $2) and "owning"."id" = $3 and "inversed"."name" in ($4, $5) and
                   "inversed"."id" = $6), 
								"insert" as
              (insert into "public"."post_categories" ("post_id", "category_id")
                select
                  "data"."post_id",
                  "data"."category_id"
                from "public"."data"
              on conflict do nothing
              returning true as inserted)
            select
              coalesce(data.selected, false) as "selected",
              coalesce(insert.inserted, false) as "inserted"
            from (values (null)) as "t" left join "public"."data" as "data" on true
              left join "public"."insert" as "insert" on true`,
						parameters: ['Lorem ipsum', 'Dolor sit', testUuid(1), 'foo', 'bar', testUuid(2)],
						response: [{ selected: true, inserted: true }],
					},
					{
						sql: SQL`with "data" as
            (select
               "owning"."id" as "post_id",
               "inversed"."id" as "category_id",
               true as "selected"
             from (values (null)) as "t" inner join "public"."post" as "owning" on true
               inner join "public"."category" as "inversed" on true
             where "owning"."name" in ($1, $2) and "owning"."id" = $3 and "inversed"."name" in ($4, $5) and
                   "inversed"."id" = $6),
                "delete" as
              (delete from "public"."post_categories"
              using "data" as "data"
              where "post_categories"."post_id" = "data"."post_id" and "post_categories"."category_id" = "data"."category_id"
              returning true as deleted)
            select
              coalesce(data.selected, false) as "selected",
              coalesce(delete.deleted, false) as "deleted"
            from (values (null)) as "t" left join "public"."data" as "data" on true
              left join "public"."delete" as "delete" on true`,
						parameters: ['Lorem ipsum', 'Dolor sit', testUuid(1), 'foo', 'bar', testUuid(3)],
						response: [{ selected: true, deleted: true }],
					},
					{
						sql: SQL`select "root_"."id" as "root_id"
                     from "public"."post" as "root_"
                     where "root_"."id" = $1`,
						response: [{ root_id: testUuid(1) }],
						parameters: [testUuid(1)],
					},
				]),
				return: {
					data: {
						updatePost: {
							id: '123e4567-e89b-12d3-a456-000000000001',
						},
					},
				},
			})
		})
	})
})
