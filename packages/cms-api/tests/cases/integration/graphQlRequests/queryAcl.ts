import { execute, sqlTransaction } from '../../../src/test'
import { GQL, SQL } from '../../../src/tags'
import { testUuid } from '../../../src/testUuid'
import SchemaBuilder from '../../../../src/content-schema/builder/SchemaBuilder'
import { Acl, Model } from 'cms-common'
import 'mocha'

describe('Queries with acl', () => {
	describe('Post + PostLocale with title restricted by locale', () => {
		const schema = new SchemaBuilder()
			.enum('locale', ['cs', 'en'])
			.entity('Post', entityBuilder => entityBuilder.oneHasMany('locales', c => c.target('PostLocale')))
			.entity('PostLocale', entity =>
				entity
					.column('title', column => column.type(Model.ColumnType.String))
					.column('locale', column => column.type(Model.ColumnType.Enum, { enumName: 'locale' }))
			)
			.buildSchema()

		const permissions: Acl.Permissions = {
			Post: {
				predicates: {},
				operations: {
					read: {
						id: true,
						locales: true
					}
				}
			},
			PostLocale: {
				predicates: {
					localePredicate: {
						locale: 'localeVariable'
					}
				},
				operations: {
					read: {
						id: true,
						title: 'localePredicate'
					}
				}
			}
		}

		it('querying id and title', async () => {
			await execute({
				schema: schema,
				permissions: permissions,
				variables: {
					localeVariable: ['cs']
				},
				query: GQL`
        query {
          PostLocales {
            id
            title
          }
        }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select
                       "root_"."id" as "root_id",
                       "root_"."title" as "root_title"
                     from "post_locale" as "root_"
                     where "root_"."locale" in ($1)`,
							parameters: ['cs'],
							response: [
								{
									root_id: testUuid(1),
									root_title: 'foo'
								},
								{
									root_id: testUuid(2),
									root_title: 'bar'
								}
							]
						}
					])
				],
				return: {
					data: {
						PostLocales: [
							{
								id: testUuid(1),
								title: 'foo'
							},
							{
								id: testUuid(2),
								title: 'bar'
							}
						]
					}
				}
			})
		})

		it('querying with extra where', async () => {
			await execute({
				schema: schema,
				permissions: permissions,
				variables: {
					localeVariable: ['cs']
				},
				query: GQL`
        query {
          PostLocales(where: {title: {eq: "foo"}}) {
            id
            title
          }
        }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select
                         "root_"."id" as "root_id",
                         "root_"."title" as "root_title"
                       from "post_locale" as "root_"
                       where "root_"."title" = $1 and "root_"."locale" in ($2) and "root_"."locale" in ($3)`,
							parameters: ['foo', 'cs', 'cs'],
							response: [
								{
									root_id: testUuid(1),
									root_title: 'foo'
								}
							]
						}
					])
				],
				return: {
					data: {
						PostLocales: [
							{
								id: testUuid(1),
								title: 'foo'
							}
						]
					}
				}
			})
		})

		it('querying only id', async () => {
			await execute({
				schema: schema,
				permissions: permissions,
				variables: {
					localeVariable: ['cs']
				},
				query: GQL`
        query {
          PostLocales {
            id
          }
        }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select
                       "root_"."id" as "root_id"
                     from "post_locale" as "root_"`,
							parameters: [],
							response: [
								{
									root_id: testUuid(1)
								}
							]
						}
					])
				],
				return: {
					data: {
						PostLocales: [
							{
								id: testUuid(1)
							}
						]
					}
				}
			})
		})

		it('not defined acl variable', async () => {
			await execute({
				schema: schema,
				permissions: permissions,
				variables: {},
				query: GQL`
        query {
          PostLocales {
            id
            title
          }
        }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select
                         "root_"."id" as "root_id",
                         "root_"."title" as "root_title"
                       from "post_locale" as "root_"
                       where false`,
							parameters: [],
							response: []
						}
					])
				],
				return: {
					data: {
						PostLocales: []
					}
				}
			})
		})

		it('querying on nested field', async () => {
			await execute({
				schema: schema,
				permissions: permissions,
				variables: {
					localeVariable: ['cs']
				},
				query: GQL`
        query {
          Posts {
            locales {
              id
              title
            }
          }
        }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select "root_"."id" as "root_id"
                       from "post" as "root_"`,
							parameters: [],
							response: [
								{
									root_id: testUuid(1)
								},
								{
									root_id: testUuid(2)
								}
							]
						},
						{
							sql: SQL`select
                         "root_"."post_id" as "__grouping_key",
                         "root_"."id" as "root_id",
                         "root_"."title" as "root_title"
                       from "post_locale" as "root_"
                       where "root_"."locale" in ($1) and "root_"."post_id" in ($2, $3)`,
							parameters: ['cs', testUuid(1), testUuid(2)],
							response: [
								{
									__grouping_key: testUuid(1),
									root_id: testUuid(3),
									root_title: 'foo'
								},
								{
									__grouping_key: testUuid(2),
									root_id: testUuid(4),
									root_title: 'bar'
								}
							]
						}
					])
				],
				return: {
					data: {
						Posts: [
							{
								locales: [
									{
										id: testUuid(3),
										title: 'foo'
									}
								]
							},
							{
								locales: [
									{
										id: testUuid(4),
										title: 'bar'
									}
								]
							}
						]
					}
				}
			})
		})
	})

	describe('Post + author restricted by country', () => {
		const schema = new SchemaBuilder()
			.enum('locale', ['cs', 'en'])
			.entity('Post', entityBuilder =>
				entityBuilder.manyHasOne('author', r =>
					r.target('Author', e =>
						e
							.column('name', c => c.type(Model.ColumnType.String))
							.manyHasOne('country', r =>
								r.target('Country', e => e.column('name', c => c.type(Model.ColumnType.String)))
							)
					)
				)
			)
			.buildSchema()

		const permissions: Acl.Permissions = {
			Post: {
				predicates: {},
				operations: {
					read: {
						id: true,
						author: true
					}
				}
			},
			Author: {
				predicates: {
					countryPredicate: {
						country: {
							name: 'countryVariable'
						}
					}
				},
				operations: {
					read: {
						id: true,
						name: 'countryPredicate'
					}
				}
			},
			Country: {
				predicates: {},
				operations: {
					read: {
						id: true
					}
				}
			}
		}

		it('querying post + author name', async () => {
			await execute({
				schema: schema,
				permissions: permissions,
				variables: {
					countryVariable: ['Czechia']
				},
				query: GQL`
        query {
          Posts {
            id
            author {
              name
            }
          }
        }`,
				executes: [
					...sqlTransaction([
						{
							sql: SQL`select
                         "root_"."id" as "root_id",
                         "root_"."author_id" as "root_author"
                       from "post" as "root_"`,
							parameters: [],
							response: [
								{
									root_id: testUuid(1),
									root_author: testUuid(3)
								},
								{
									root_id: testUuid(2),
									root_author: testUuid(4)
								}
							]
						},
						{
							sql: SQL`select
                         "root_"."id" as "root_id",
                         "root_"."id" as "root_id",
                         "root_"."name" as "root_name",
                         "root_country"."id" as "root_country_id"
                       from "author" as "root_" left join "country" as "root_country" on "root_"."country_id" = "root_country"."id"
                       where "root_"."id" in ($1, $2) and "root_country"."name" in ($3)`,
							parameters: [testUuid(3), testUuid(4), 'Czechia'],
							response: [
								{
									root_id: testUuid(3),
									root_name: 'John'
								}
							]
						}
					])
				],
				return: {
					data: {
						Posts: [
							{
								author: {
									name: 'John'
								},
								id: testUuid(1)
							},
							{
								author: null,
								id: testUuid(2)
							}
						]
					}
				}
			})
		})
	})
})
