import { execute, sqlTransaction } from '../../src/test'
import { Model } from 'cms-common'
import SchemaBuilder from '../../../src/content-schema/builder/SchemaBuilder'
import { GQL, SQL } from '../../src/tags'
import { testUuid } from '../../src/testUuid'
import 'mocha'

describe('update', () => {
	const selectUpdatePostSql = {
		sql: SQL`SELECT
            "updatePost"."id" AS "id"
            FROM "post" "updatePost"
            WHERE "updatePost"."id" = '${testUuid(2)}'`,
		response: [{ id: testUuid(2) }]
	}

	describe('columns (author)', () => {
		it('update name', async () => {
			await execute({
				schema: new SchemaBuilder()
					.entity('Author', e => e.column('name', c => c.type(Model.ColumnType.String)))
					.buildSchema(),
				query: GQL`mutation {
        updateAuthor(
            where: {id: "${testUuid(1)}"},
            data: {name: "John"}
          ) {
          id
        }
      }`,
				executes: [
					{
						sql: SQL`BEGIN;`
					},
					{
						sql: SQL`update "author"
            set "name" = $1
            where "id" = $2`,
						parameters: ['John', testUuid(1)]
					},
					{
						sql: SQL`COMMIT;`
					},
					{
						sql: SQL`SELECT "updateAuth"."id" AS "id"
                   FROM "author" "updateAuth"
                   WHERE "updateAuth"."id" = '${testUuid(1)}'`,
						response: [
							{
								id: testUuid(1)
							}
						]
					}
				],
				return: {
					data: {
						updateAuthor: {
							id: testUuid(1)
						}
					}
				}
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
            where: {id: "${testUuid(2)}"},
            data: {author: {create: {name: "John"}}}
          ) {
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`insert into "author" ("id", "name") values ($1, $2)
              returning "id"`,
							parameters: [testUuid(1), 'John'],
							response: [testUuid(1)]
						},

						{
							sql: SQL`update "post"
              set "author_id" = $1
              where "id" = $2`,
							parameters: [testUuid(1), testUuid(2)]
						}
					]),
					selectUpdatePostSql
				],
				return: {
					data: {
						updatePost: {
							id: testUuid(2)
						}
					}
				}
			})
		})

		it('connect', async () => {
			await execute({
				schema: postWithAuthor,
				query: GQL`mutation {
        updatePost(
            where: {id: "${testUuid(2)}"},
            data: {author: {connect: {id: "${testUuid(1)}"}}}
          ) {
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`update "post"
              set "author_id" = $1
              where "id" = $2`,
							parameters: [testUuid(1), testUuid(2)]
						}
					]),
					selectUpdatePostSql
				],
				return: {
					data: {
						updatePost: {
							id: testUuid(2)
						}
					}
				}
			})
		})

		it('update', async () => {
			await execute({
				schema: postWithAuthor,
				query: GQL`mutation {
        updatePost(
            where: {id: "${testUuid(2)}"},
            data: {author: {update: {name: "John"}}}
          ) {
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "author_id"
                       from "post"
                       where "id" = $1`,
							parameters: [testUuid(2)],
							response: [{ author_id: testUuid(1) }]
						},
						{
							sql: SQL`update "author"
              set "name" = $1
              where "id" = $2`,
							parameters: ['John', testUuid(1)]
						}
					]),
					selectUpdatePostSql
				],
				return: {
					data: {
						updatePost: {
							id: testUuid(2)
						}
					}
				}
			})
		})

		it('upsert - exists', async () => {
			await execute({
				schema: postWithAuthor,
				query: GQL`mutation {
        updatePost(
            where: {id: "${testUuid(2)}"},
            data: {author: {upsert: {create: {name: "John"}, update: {name: "Jack"}}}}
          ) {
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "author_id"
                       from "post"
                       where "id" = $1`,
							parameters: [testUuid(2)],
							response: [{ author_id: testUuid(1) }]
						},
						{
							sql: SQL`update "author"
              set "name" = $1
              where "id" = $2`,
							parameters: ['Jack', testUuid(1)]
						}
					]),
					selectUpdatePostSql
				],
				return: {
					data: {
						updatePost: {
							id: testUuid(2)
						}
					}
				}
			})
		})

		it('upsert - not exists', async () => {
			await execute({
				schema: postWithAuthor,
				query: GQL`mutation {
        updatePost(
            where: {id: "${testUuid(2)}"},
            data: {author: {upsert: {create: {name: "John"}, update: {name: "Jack"}}}}
          ) {
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "author_id"
                       from "post"
                       where "id" = $1`,
							parameters: [testUuid(2)],
							response: []
						},
						{
							sql: SQL`insert into "author" ("id", "name") values ($1, $2)
              returning "id"`,
							parameters: [testUuid(1), 'John'],
							response: [testUuid(1)]
						},
						{
							sql: SQL`update "post"
              set "author_id" = $1
              where "id" = $2`,
							parameters: [testUuid(1), testUuid(2)]
						}
					]),
					selectUpdatePostSql
				],
				return: {
					data: {
						updatePost: {
							id: testUuid(2)
						}
					}
				}
			})
		})

		it('disconnect', async () => {
			await execute({
				schema: postWithNullableAuthor,
				query: GQL`mutation {
        updatePost(
            where: {id: "${testUuid(2)}"},
            data: {author: {disconnect: true}}
          ) {
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`update "post"
              set "author_id" = $1
              where "id" = $2`,
							parameters: [null, testUuid(2)]
						}
					]),
					selectUpdatePostSql
				],
				return: {
					data: {
						updatePost: {
							id: testUuid(2)
						}
					}
				}
			})
		})

		it('delete', async () => {
			await execute({
				schema: postWithNullableAuthor,
				query: GQL`mutation {
        updatePost(
            where: {id: "${testUuid(2)}"},
            data: {author: {delete: true}}
          ) {
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "author_id"
                       from "post"
                       where "id" = $1`,
							parameters: [testUuid(2)],
							response: [{ author_id: testUuid(1) }]
						},
						{
							sql: SQL`update "post"
              set "author_id" = $1
              where "id" = $2`,
							parameters: [null, testUuid(2)]
						},
						{
							sql: SQL`delete from "author"
              where "id" = $1`,
							parameters: [testUuid(1)]
						}
					]),
					selectUpdatePostSql
				],
				return: {
					data: {
						updatePost: {
							id: testUuid(2)
						}
					}
				}
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
            where: {id: "${testUuid(2)}"},
            data: {locales: [{create: {title: "Hello", locale: "cs"}}]}
          ) {
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`insert into "post_locale" ("id", "locale", "post_id", "title") values ($1, $2, $3, $4)
              returning "id"`,
							parameters: [testUuid(1), 'cs', testUuid(2), 'Hello'],
							response: [testUuid(1)]
						}
					]),
					selectUpdatePostSql
				],
				return: {
					data: {
						updatePost: {
							id: testUuid(2)
						}
					}
				}
			})
		})

		it('update (composed unique)', async () => {
			await execute({
				schema: postWithLocale,
				query: GQL`mutation {
        updatePost(
            where: {id: "${testUuid(2)}"},
            data: {locales: [{update: {where: {locale: "cs"}, data: {title: "Hello"}}}]}
          ) {
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "id"
                       from "post_locale"
                       where "locale" = $1 and "post_id" = $2`,
							parameters: ['cs', testUuid(2)],
							response: [{ id: testUuid(1) }]
						},
						{
							sql: SQL`update "post_locale"
              set "title" = $1
              where "locale" = $2 and "post_id" = $3`,
							parameters: ['Hello', 'cs', testUuid(2)]
						}
					]),
					selectUpdatePostSql
				],
				return: {
					data: {
						updatePost: {
							id: testUuid(2)
						}
					}
				}
			})
		})

		it('upsert - exists (composed unique)', async () => {
			await execute({
				schema: postWithLocale,
				query: GQL`mutation {
        updatePost(
            where: {id: "${testUuid(2)}"},
            data: {locales: [{upsert: {where: {locale: "cs"}, update: {title: "Hello"}, create: {title: "World"}}}]}
          ) {
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "id"
                       from "post_locale"
                       where "locale" = $1 and "post_id" = $2`,
							parameters: ['cs', testUuid(2)],
							response: [{ id: testUuid(1) }]
						},
						{
							sql: SQL`update "post_locale"
              set "title" = $1
              where "locale" = $2 and "post_id" = $3`,
							parameters: ['Hello', 'cs', testUuid(2)]
						}
					]),
					selectUpdatePostSql
				],
				return: {
					data: {
						updatePost: {
							id: testUuid(2)
						}
					}
				}
			})
		})

		it('upsert - not exists (composed unique)', async () => {
			await execute({
				schema: postWithLocale,
				query: GQL`mutation {
        updatePost(
            where: {id: "${testUuid(2)}"},
            data: {locales: [{upsert: {where: {locale: "cs"}, update: {title: "Hello"}, create: {title: "World", locale: "cs"}}}]}
          ) {
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "id"
                       from "post_locale"
                       where "locale" = $1 and "post_id" = $2`,
							parameters: ['cs', testUuid(2)],
							response: []
						},
						{
							sql: SQL`insert into "post_locale" ("id", "locale", "post_id", "title") values ($1, $2, $3, $4)
              returning "id"`,
							parameters: [testUuid(1), 'cs', testUuid(2), 'World']
						}
					]),
					selectUpdatePostSql
				],
				return: {
					data: {
						updatePost: {
							id: testUuid(2)
						}
					}
				}
			})
		})

		it('delete', async () => {
			await execute({
				schema: postWithLocale,
				query: GQL`mutation {
        updatePost(
            where: {id: "${testUuid(2)}"},
            data: {locales: [{delete: {locale: "cs"}}]}
          ) {
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`delete from "post_locale"
              where "locale" = $1 and "post_id" = $2`,
							parameters: ['cs', testUuid(2)]
						}
					]),
					selectUpdatePostSql
				],
				return: {
					data: {
						updatePost: {
							id: testUuid(2)
						}
					}
				}
			})
		})

		it('connect', async () => {
			await execute({
				schema: postWithLocale,
				query: GQL`mutation {
        updatePost(
            where: {id: "${testUuid(2)}"},
            data: {locales: [{connect: {id: "${testUuid(1)}"}}]}
          ) {
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`update "post_locale"
              set "post_id" = $1
              where "id" = $2`,
							parameters: [testUuid(2), testUuid(1)]
						}
					]),
					selectUpdatePostSql
				],
				return: {
					data: {
						updatePost: {
							id: testUuid(2)
						}
					}
				}
			})
		})

		it('disconnect', async () => {
			await execute({
				schema: postWithNullableLocale,
				query: GQL`mutation {
        updatePost(
            where: {id: "${testUuid(2)}"},
            data: {locales: [{disconnect: {id: "${testUuid(1)}"}}]}
          ) {
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`update "post_locale"
              set "post_id" = $1
              where "id" = $2 and "post_id" = $3`,
							parameters: [null, testUuid(1), testUuid(2)]
						}
					]),
					selectUpdatePostSql
				],
				return: {
					data: {
						updatePost: {
							id: testUuid(2)
						}
					}
				}
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
			sql: SQL`SELECT
              "updateSite"."id" AS "id"
              FROM "site" "updateSite"
              WHERE "updateSite"."id" = '${testUuid(2)}'`,
			response: [{ id: testUuid(2) }]
		}

		it('create', async () => {
			await execute({
				schema: siteSettingSchema,
				query: GQL`mutation {
        updateSite(
            where: {id: "${testUuid(2)}"},
            data: {setting: {create: {url: "http://mangoweb.cz"}}}
          ) {
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`insert into "site_setting" ("id", "url") values ($1, $2)
              returning "id"`,
							parameters: [testUuid(1), 'http://mangoweb.cz'],
							response: [testUuid(1)]
						},
						{
							sql: SQL`update "site"
              set "setting_id" = $1
              where "id" = $2`,
							parameters: [testUuid(1), testUuid(2)]
						}
					]),
					selectUpdateSiteSql
				],
				return: {
					data: {
						updateSite: {
							id: testUuid(2)
						}
					}
				}
			})
		})

		it('update', async () => {
			await execute({
				schema: siteSettingSchema,
				query: GQL`mutation {
        updateSite(
            where: {id: "${testUuid(2)}"},
            data: {setting: {update: {url: "http://mangoweb.cz"}}}
          ) {
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "setting_id"
                       from "site"
                       where "id" = $1`,
							parameters: [testUuid(2)],
							response: [{ setting_id: testUuid(1) }]
						},
						{
							sql: SQL`update "site_setting"
              set "url" = $1
              where "id" = $2`,
							parameters: ['http://mangoweb.cz', testUuid(1)]
						}
					]),
					selectUpdateSiteSql
				],
				return: {
					data: {
						updateSite: {
							id: testUuid(2)
						}
					}
				}
			})
		})

		it('connect - same owner', async () => {
			await execute({
				schema: siteSettingSchema,
				query: GQL`mutation {
        updateSite(
            where: {id: "${testUuid(2)}"},
            data: {setting: {connect: {id: "${testUuid(1)}"}}}
          ) {
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "id"
                       from "site"
                       where "setting_id" = $1`,
							parameters: [testUuid(1)],
							response: [{ id: testUuid(2) }]
						}
					]),
					selectUpdateSiteSql
				],
				return: {
					data: {
						updateSite: {
							id: testUuid(2)
						}
					}
				}
			})
		})

		it('connect - no owner', async () => {
			await execute({
				schema: siteSettingSchema,
				query: GQL`mutation {
        updateSite(
            where: {id: "${testUuid(2)}"},
            data: {setting: {connect: {id: "${testUuid(1)}"}}}
          ) {
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "id"
                       from "site"
                       where "setting_id" = $1`,
							parameters: [testUuid(1)],
							response: []
						},
						{
							sql: SQL`update "site"
              set "setting_id" = $1
              where "id" = $2`,
							parameters: [testUuid(1), testUuid(2)]
						}
					]),
					selectUpdateSiteSql
				],
				return: {
					data: {
						updateSite: {
							id: testUuid(2)
						}
					}
				}
			})
		})

		it('connect - different owner', async () => {
			await execute({
				schema: siteSettingSchema,
				query: GQL`mutation {
        updateSite(
            where: {id: "${testUuid(2)}"},
            data: {setting: {connect: {id: "${testUuid(1)}"}}}
          ) {
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "id"
                       from "site"
                       where "setting_id" = $1`,
							parameters: [testUuid(1)],
							response: [{ id: testUuid(3) }]
						},
						{
							sql: SQL`update "site"
              set "setting_id" = $1
              where "id" = $2`,
							parameters: [null, testUuid(3)]
						},
						{
							sql: SQL`update "site"
              set "setting_id" = $1
              where "id" = $2`,
							parameters: [testUuid(1), testUuid(2)]
						}
					]),
					selectUpdateSiteSql
				],
				return: {
					data: {
						updateSite: {
							id: testUuid(2)
						}
					}
				}
			})
		})

		it('upsert - exists', async () => {
			await execute({
				schema: siteSettingSchema,
				query: GQL`mutation {
        updateSite(
            where: {id: "${testUuid(2)}"},
            data: {setting: {upsert: {update: {url: "http://mangoweb.cz"}, create: {url: "http://mgw.cz"}}}}
          ) {
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "setting_id"
                       from "site"
                       where "id" = $1`,
							parameters: [testUuid(2)],
							response: []
						},
						{
							sql: SQL`insert into "site_setting" ("id", "url") values ($1, $2)
              returning "id"`,
							parameters: [testUuid(1), 'http://mgw.cz'],
							response: [testUuid(1)]
						},
						{
							sql: SQL`update "site"
              set "setting_id" = $1
              where "id" = $2`,
							parameters: [testUuid(1), testUuid(2)]
						}
					]),
					selectUpdateSiteSql
				],
				return: {
					data: {
						updateSite: {
							id: testUuid(2)
						}
					}
				}
			})
		})

		it('upsert - not exists', async () => {
			await execute({
				schema: siteSettingSchema,
				query: GQL`mutation {
        updateSite(
            where: {id: "${testUuid(2)}"},
            data: {setting: {upsert: {update: {url: "http://mangoweb.cz"}, create: {url: "http://mgw.cz"}}}}
          ) {
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "setting_id"
                       from "site"
                       where "id" = $1`,
							parameters: [testUuid(2)],
							response: []
						},
						{
							sql: SQL`insert into "site_setting" ("id", "url") values ($1, $2)
              returning "id"`,
							parameters: [testUuid(1), 'http://mgw.cz'],
							response: [testUuid(1)]
						},
						{
							sql: SQL`update "site"
              set "setting_id" = $1
              where "id" = $2`,
							parameters: [testUuid(1), testUuid(2)]
						}
					]),
					selectUpdateSiteSql
				],
				return: {
					data: {
						updateSite: {
							id: testUuid(2)
						}
					}
				}
			})
		})

		it('disconnect', async () => {
			await execute({
				schema: siteSettingSchema,
				query: GQL`mutation {
        updateSite(
            where: {id: "${testUuid(2)}"},
            data: {setting: {disconnect: true}}
          ) {
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`update "site"
              set "setting_id" = $1
              where "id" = $2`,
							parameters: [null, testUuid(2)]
						}
					]),
					selectUpdateSiteSql
				],
				return: {
					data: {
						updateSite: {
							id: testUuid(2)
						}
					}
				}
			})
		})

		it('delete', async () => {
			await execute({
				schema: siteSettingSchema,
				query: GQL`mutation {
        updateSite(
            where: {id: "${testUuid(2)}"},
            data: {setting: {delete: true}}
          ) {
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "setting_id"
                       from "site"
                       where "id" = $1`,
							parameters: [testUuid(2)],
							response: [{ setting_id: testUuid(1) }]
						},
						{
							sql: SQL`update "site"
              set "setting_id" = $1
              where "id" = $2`,
							parameters: [null, testUuid(2)]
						},
						{
							sql: SQL`delete from "site_setting"
              where "id" = $1`,
							parameters: [testUuid(1)]
						}
					]),
					selectUpdateSiteSql
				],
				return: {
					data: {
						updateSite: {
							id: testUuid(2)
						}
					}
				}
			})
		})
	})

	describe('one has one inversed (site and setting)', () => {
		const selectUpdateSiteSettingSql = {
			sql: SQL`SELECT
              "updateSite"."id" AS "id"
              FROM "site_setting" "updateSite"
              WHERE "updateSite"."id" = '${testUuid(2)}'`,
			response: [{ id: testUuid(2) }]
		}

		it('create', async () => {
			await execute({
				schema: siteSettingSchema,
				query: GQL`mutation {
        updateSiteSetting(
            where: {id: "${testUuid(2)}"},
            data: {site: {create: {name: "Mangoweb"}}}
          ) {
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "id"
                       from "site"
                       where "setting_id" = $1`,
							parameters: [testUuid(2)],
							response: [{ id: testUuid(3) }]
						},
						{
							sql: SQL`update "site"
              set "setting_id" = $1
              where "setting_id" = $2`,
							parameters: [null, testUuid(2)]
						},
						{
							sql: SQL`insert into "site" ("id", "name", "setting_id") values ($1, $2, $3)
              returning "id"`,
							parameters: [testUuid(1), 'Mangoweb', testUuid(2)],
							response: [testUuid(1)]
						}
					]),
					selectUpdateSiteSettingSql
				],
				return: {
					data: {
						updateSiteSetting: {
							id: testUuid(2)
						}
					}
				}
			})
		})

		it('create - no owner', async () => {
			await execute({
				schema: siteSettingSchema,
				query: GQL`mutation {
        updateSiteSetting(
            where: {id: "${testUuid(2)}"},
            data: {site: {create: {name: "Mangoweb"}}}
          ) {
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "id"
                       from "site"
                       where "setting_id" = $1`,
							parameters: [testUuid(2)],
							response: []
						},
						{
							sql: SQL`insert into "site" ("id", "name", "setting_id") values ($1, $2, $3)
              returning "id"`,
							parameters: [testUuid(1), 'Mangoweb', testUuid(2)],
							response: [testUuid(1)]
						}
					]),
					selectUpdateSiteSettingSql
				],
				return: {
					data: {
						updateSiteSetting: {
							id: testUuid(2)
						}
					}
				}
			})
		})

		it('update', async () => {
			await execute({
				schema: siteSettingSchema,
				query: GQL`mutation {
        updateSiteSetting(
            where: {id: "${testUuid(2)}"},
            data: {site: {update: {name: "Mangoweb"}}}
          ) {
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "id"
                       from "site"
                       where "setting_id" = $1`,
							parameters: [testUuid(2)],
							response: [{ id: testUuid(1) }]
						},
						{
							sql: SQL`update "site"
              set "name" = $1
              where "setting_id" = $2`,
							parameters: ['Mangoweb', testUuid(2)]
						}
					]),
					selectUpdateSiteSettingSql
				],
				return: {
					data: {
						updateSiteSetting: {
							id: testUuid(2)
						}
					}
				}
			})
		})

		it('upsert - exists', async () => {
			await execute({
				schema: siteSettingSchema,
				query: GQL`mutation {
        updateSiteSetting(
            where: {id: "${testUuid(2)}"},
            data: {site: {upsert: {update: {name: "Mangoweb"}, create: {name: "Mgw"}}}}
          ) {
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "id"
                       from "site"
                       where "setting_id" = $1`,
							parameters: [testUuid(2)],
							response: [{ id: testUuid(1) }]
						},
						{
							sql: SQL`update "site"
              set "name" = $1
              where "setting_id" = $2`,
							parameters: ['Mangoweb', testUuid(2)]
						}
					]),
					selectUpdateSiteSettingSql
				],
				return: {
					data: {
						updateSiteSetting: {
							id: testUuid(2)
						}
					}
				}
			})
		})

		it('upsert - not exists', async () => {
			await execute({
				schema: siteSettingSchema,
				query: GQL`mutation {
        updateSiteSetting(
            where: {id: "${testUuid(2)}"},
           data: {site: {upsert: {update: {name: "Mangoweb"}, create: {name: "Mgw"}}}}
          ) {
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "id"
                       from "site"
                       where "setting_id" = $1`,
							parameters: [testUuid(2)],
							response: []
						},
						{
							sql: SQL`insert into "site" ("id", "name", "setting_id") values ($1, $2, $3)
              returning "id"`,
							parameters: [testUuid(1), 'Mgw', testUuid(2)],
							response: [testUuid(1)]
						}
					]),
					selectUpdateSiteSettingSql
				],
				return: {
					data: {
						updateSiteSetting: {
							id: testUuid(2)
						}
					}
				}
			})
		})

		it('disconnect', async () => {
			await execute({
				schema: siteSettingSchema,
				query: GQL`mutation {
        updateSiteSetting(
            where: {id: "${testUuid(2)}"},
            data: {site: {disconnect: true}}
          ) {
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "id"
                       from "site"
                       where "setting_id" = $1`,
							parameters: [testUuid(2)],
							response: [{ id: testUuid(1) }]
						},
						{
							sql: SQL`update "site"
              set "setting_id" = $1
              where "setting_id" = $2`,
							parameters: [null, testUuid(2)]
						}
					]),
					selectUpdateSiteSettingSql
				],
				return: {
					data: {
						updateSiteSetting: {
							id: testUuid(2)
						}
					}
				}
			})
		})

		it('delete', async () => {
			await execute({
				schema: siteSettingSchema,
				query: GQL`mutation {
        updateSiteSetting(
            where: {id: "${testUuid(2)}"},
            data: {site: {delete: true}}
          ) {
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`delete from "site"
              where "setting_id" = $1`,
							parameters: [testUuid(2)]
						}
					]),
					selectUpdateSiteSettingSql
				],
				return: {
					data: {
						updateSiteSetting: {
							id: testUuid(2)
						}
					}
				}
			})
		})

		it('connect - same owner', async () => {
			await execute({
				schema: siteSettingSchema,
				query: GQL`mutation {
        updateSiteSetting(
            where: {id: "${testUuid(2)}"},
            data: {site: {connect: {id: "${testUuid(1)}"}}}
          ) {
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "id"
                       from "site"
                       where "setting_id" = $1`,
							parameters: [testUuid(2)],
							response: [{ id: testUuid(1) }]
						}
					]),
					selectUpdateSiteSettingSql
				],
				return: {
					data: {
						updateSiteSetting: {
							id: testUuid(2)
						}
					}
				}
			})
		})

		it('connect - no owner', async () => {
			await execute({
				schema: siteSettingSchema,
				query: GQL`mutation {
        updateSiteSetting(
            where: {id: "${testUuid(2)}"},
            data: {site: {connect: {id: "${testUuid(1)}"}}}
          ) {
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "id"
                       from "site"
                       where "setting_id" = $1`,
							parameters: [testUuid(2)],
							response: []
						},
						{
							sql: SQL`update "site"
              set "setting_id" = $1
              where "id" = $2`,
							parameters: [testUuid(2), testUuid(1)]
						}
					]),
					selectUpdateSiteSettingSql
				],
				return: {
					data: {
						updateSiteSetting: {
							id: testUuid(2)
						}
					}
				}
			})
		})

		it('connect - different owner', async () => {
			await execute({
				schema: siteSettingSchema,
				query: GQL`mutation {
        updateSiteSetting(
            where: {id: "${testUuid(2)}"},
            data: {site: {connect: {id: "${testUuid(1)}"}}}
          ) {
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "id"
                       from "site"
                       where "setting_id" = $1`,
							parameters: [testUuid(2)],
							response: [{ id: testUuid(3) }]
						},
						{
							sql: SQL`update "site"
              set "setting_id" = $1
              where "id" = $2`,
							parameters: [null, testUuid(3)]
						},
						{
							sql: SQL`update "site"
              set "setting_id" = $1
              where "id" = $2`,
							parameters: [testUuid(2), testUuid(1)]
						}
					]),
					selectUpdateSiteSettingSql
				],
				return: {
					data: {
						updateSiteSetting: {
							id: testUuid(2)
						}
					}
				}
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
            where: {id: "${testUuid(2)}"},
            data: {categories: [{connect: {id: "${testUuid(1)}"}}]}
          ) {
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`insert into "post_categories" ("category_id", "post_id") values ('${testUuid(1)}', '${testUuid(
								2
							)}')
              on conflict do nothing`
						}
					]),
					selectUpdatePostSql
				],
				return: {
					data: {
						updatePost: {
							id: testUuid(2)
						}
					}
				}
			})
		})

		it('create', async () => {
			await execute({
				schema: postWithCategories,
				query: GQL`mutation {
        updatePost(
            where: {id: "${testUuid(2)}"},
            data: {categories: [{create: {name: "Lorem"}}]}
          ) {
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`insert into "category" ("id", "name") values ($1, $2)
              returning "id"`,
							parameters: [testUuid(1), 'Lorem'],
							response: [testUuid(1)]
						},
						{
							sql: SQL`insert into "post_categories" ("category_id", "post_id") values ('${testUuid(1)}', '${testUuid(
								2
							)}')
              on conflict do nothing`
						}
					]),
					selectUpdatePostSql
				],
				return: {
					data: {
						updatePost: {
							id: testUuid(2)
						}
					}
				}
			})
		})

		it('delete', async () => {
			await execute({
				schema: postWithCategories,
				query: GQL`mutation {
        updatePost(
            where: {id: "${testUuid(2)}"},
            data: {categories: [{delete: {id: "${testUuid(1)}"}}]}
          ) {
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`delete from "post_categories"
              where "post_id" = $1 and "category_id" = $2`,
							parameters: [testUuid(2), testUuid(1)]
						},
						{
							sql: SQL`delete from "category"
              where "id" = $1`,
							parameters: [testUuid(1)]
						}
					]),
					selectUpdatePostSql
				],
				return: {
					data: {
						updatePost: {
							id: testUuid(2)
						}
					}
				}
			})
		})

		it('disconnect', async () => {
			await execute({
				schema: postWithCategories,
				query: GQL`mutation {
        updatePost(
            where: {id: "${testUuid(2)}"},
            data: {categories: [{disconnect: {id: "${testUuid(1)}"}}]}
          ) {
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`delete from "post_categories"
              where "post_id" = $1 and "category_id" = $2`,
							parameters: [testUuid(2), testUuid(1)]
						}
					]),
					selectUpdatePostSql
				],
				return: {
					data: {
						updatePost: {
							id: testUuid(2)
						}
					}
				}
			})
		})

		it('update', async () => {
			await execute({
				schema: postWithCategories,
				query: GQL`mutation {
        updatePost(
            where: {id: "${testUuid(2)}"},
            data: {categories: [{update: {where: {id: "${testUuid(1)}"}, data: {name: "Lorem"}}}]}
          ) {
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`update "category"
              set "name" = $1
              where "id" = $2`,
							parameters: ['Lorem', testUuid(1)]
						},
						{
							sql: SQL`insert into "post_categories" ("category_id", "post_id") values ('${testUuid(1)}', '${testUuid(
								2
							)}')
              on conflict do nothing`
						}
					]),
					selectUpdatePostSql
				],
				return: {
					data: {
						updatePost: {
							id: testUuid(2)
						}
					}
				}
			})
		})

		it('upsert - exists', async () => {
			await execute({
				schema: postWithCategories,
				query: GQL`mutation {
        updatePost(
            where: {id: "${testUuid(2)}"},
            data: {categories: [{upsert: {where: {id: "${testUuid(
							1
						)}"}, update: {name: "Lorem"}, create: {name: "Ipsum"}}}]}
          ) {
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`update "category"
              set "name" = $1
              where "id" = $2`,
							parameters: ['Lorem', testUuid(1)],
							response: 1
						},
						{
							sql: SQL`insert into "post_categories" ("category_id", "post_id") values ('${testUuid(1)}', '${testUuid(
								2
							)}')
              on conflict do nothing`
						}
					]),
					selectUpdatePostSql
				],
				return: {
					data: {
						updatePost: {
							id: testUuid(2)
						}
					}
				}
			})
		})

		it('upsert - not exists', async () => {
			await execute({
				schema: postWithCategories,
				query: GQL`mutation {
        updatePost(
            where: {id: "${testUuid(2)}"},
            data: {categories: [{upsert: {where: {id: "${testUuid(
							1
						)}"}, update: {name: "Lorem"}, create: {name: "Ipsum"}}}]}
          ) {
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`update "category"
              set "name" = $1
              where "id" = $2`,
							parameters: ['Lorem', testUuid(1)],
							response: 0
						},
						{
							sql: SQL`insert into "category" ("id", "name") values ($1, $2)
              returning "id"`,
							parameters: [testUuid(1), 'Ipsum'],
							response: [testUuid(1)]
						},
						{
							sql: SQL`insert into "post_categories" ("category_id", "post_id") values ('${testUuid(1)}', '${testUuid(
								2
							)}')
              on conflict do nothing`
						}
					]),
					selectUpdatePostSql
				],
				return: {
					data: {
						updatePost: {
							id: testUuid(2)
						}
					}
				}
			})
		})
	})

	describe('many has many inversed (category posts)', () => {
		const selectUpdateCategorySql = {
			sql: SQL`SELECT
            "updateCate"."id" AS "id"
            FROM "category" "updateCate"
            WHERE "updateCate"."id" = '${testUuid(2)}'`,
			response: [{ id: testUuid(2) }]
		}

		it('connect', async () => {
			await execute({
				schema: postWithCategories,
				query: GQL`mutation {
        updateCategory(
            where: {id: "${testUuid(2)}"},
            data: {posts: [{connect: {id: "${testUuid(1)}"}}]}
          ) {
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`insert into "post_categories" ("category_id", "post_id") values ('${testUuid(2)}', '${testUuid(
								1
							)}')
              on conflict do nothing`
						}
					]),
					selectUpdateCategorySql
				],
				return: {
					data: {
						updateCategory: {
							id: testUuid(2)
						}
					}
				}
			})
		})

		it('create', async () => {
			await execute({
				schema: postWithCategories,
				query: GQL`mutation {
        updateCategory(
            where: {id: "${testUuid(2)}"},
            data: {posts: [{create: {title: "Lorem"}}]}
          ) {
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`insert into "post" ("id", "title") values ($1, $2)
              returning "id"`,
							parameters: [testUuid(1), 'Lorem'],
							response: [testUuid(1)]
						},
						{
							sql: SQL`insert into "post_categories" ("category_id", "post_id") values ('${testUuid(2)}', '${testUuid(
								1
							)}')
              on conflict do nothing`
						}
					]),
					selectUpdateCategorySql
				],
				return: {
					data: {
						updateCategory: {
							id: testUuid(2)
						}
					}
				}
			})
		})

		it('delete', async () => {
			await execute({
				schema: postWithCategories,
				query: GQL`mutation {
        updateCategory(
            where: {id: "${testUuid(2)}"},
            data: {posts: [{delete: {id: "${testUuid(1)}"}}]}
          ) {
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`delete from "post_categories"
              where "post_id" = $1 and "category_id" = $2`,
							parameters: [testUuid(1), testUuid(2)]
						},
						{
							sql: SQL`delete from "post"
              where "id" = $1`,
							parameters: [testUuid(1)]
						}
					]),
					selectUpdateCategorySql
				],
				return: {
					data: {
						updateCategory: {
							id: testUuid(2)
						}
					}
				}
			})
		})

		it('disconnect', async () => {
			await execute({
				schema: postWithCategories,
				query: GQL`mutation {
        updateCategory(
            where: {id: "${testUuid(2)}"},
            data: {posts: [{disconnect: {id: "${testUuid(1)}"}}]}
          ) {
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`delete from "post_categories"
              where "post_id" = $1 and "category_id" = $2`,
							parameters: [testUuid(1), testUuid(2)]
						}
					]),
					selectUpdateCategorySql
				],
				return: {
					data: {
						updateCategory: {
							id: testUuid(2)
						}
					}
				}
			})
		})

		it('update', async () => {
			await execute({
				schema: postWithCategories,
				query: GQL`mutation {
        updateCategory(
            where: {id: "${testUuid(2)}"},
            data: {posts: [{update: {where: {id: "${testUuid(1)}"}, data: {title: "Lorem"}}}]}
          ) {
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`update "post"
              set "title" = $1
              where "id" = $2`,
							parameters: ['Lorem', testUuid(1)]
						},
						{
							sql: SQL`insert into "post_categories" ("category_id", "post_id") values ('${testUuid(2)}', '${testUuid(
								1
							)}')
              on conflict do nothing`
						}
					]),
					selectUpdateCategorySql
				],
				return: {
					data: {
						updateCategory: {
							id: testUuid(2)
						}
					}
				}
			})
		})

		it('upsert - exists', async () => {
			await execute({
				schema: postWithCategories,
				query: GQL`mutation {
        updateCategory(
            where: {id: "${testUuid(2)}"},
            data: {posts: [{upsert: {where: {id: "${testUuid(
							1
						)}"}, update: {title: "Lorem"}, create: {title: "Ipsum"}}}]}
          ) {
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`update "post"
              set "title" = $1
              where "id" = $2`,
							parameters: ['Lorem', testUuid(1)],
							response: 1
						},
						{
							sql: SQL`insert into "post_categories" ("category_id", "post_id") values ('${testUuid(2)}', '${testUuid(
								1
							)}')
              on conflict do nothing`
						}
					]),
					selectUpdateCategorySql
				],
				return: {
					data: {
						updateCategory: {
							id: testUuid(2)
						}
					}
				}
			})
		})

		it('upsert - not exists', async () => {
			await execute({
				schema: postWithCategories,
				query: GQL`mutation {
        updateCategory(
            where: {id: "${testUuid(2)}"},
            data: {posts: [{upsert: {where: {id: "${testUuid(
							1
						)}"}, update: {title: "Lorem"}, create: {title: "Ipsum"}}}]}
          ) {
          id
        }
      }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`update "post"
              set "title" = $1
              where "id" = $2`,
							parameters: ['Lorem', testUuid(1)],
							response: 0
						},
						{
							sql: SQL`insert into "post" ("id", "title") values ($1, $2)
              returning "id"`,
							parameters: [testUuid(1), 'Ipsum'],
							response: [testUuid(1)]
						},
						{
							sql: SQL`insert into "post_categories" ("category_id", "post_id") values ('${testUuid(2)}', '${testUuid(
								1
							)}')
              on conflict do nothing`
						}
					]),
					selectUpdateCategorySql
				],
				return: {
					data: {
						updateCategory: {
							id: testUuid(2)
						}
					}
				}
			})
		})
	})
})
