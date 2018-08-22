import { Model } from 'cms-common'
import { execute, sqlTransaction } from '../../../src/test'
import { GQL, SQL } from '../../../src/tags'
import { testUuid } from '../../../src/testUuid'
import SchemaBuilder from '../../../../src/content-schema/builder/SchemaBuilder'
import 'mocha'

describe('Queries', () => {
	it('Post by id query', async () => {
		await execute({
			schema: new SchemaBuilder()
				.entity('Post', entity => entity.column('title', column => column.type(Model.ColumnType.String)))
				.buildSchema(),
			query: GQL`
        query {
          Post(where: {id: "${testUuid(1)}"}) {
            id
          }
        }`,
			executes: [
				...sqlTransaction([
					{
						sql: SQL`select "root_"."id" as "root_id"
                     from "post" as "root_"
                     where "root_"."id" = $1`,
						response: [{ root_id: testUuid(1) }],
						parameters: [testUuid(1)]
					}
				])
			],
			return: {
				data: {
					Post: {
						id: testUuid(1)
					}
				}
			}
		})
	})

	it('Post locale by post and locale (composed unique)', async () => {
		await execute({
			schema: new SchemaBuilder()
				.entity('Post', entity =>
					entity
						.column('title', column => column.type(Model.ColumnType.String))
						.oneHasMany('locales', relation => relation.target('PostLocale').ownedBy('post'))
				)
				.entity('PostLocale', entity =>
					entity
						.unique(['locale', 'post'])
						.column('locale', column => column.type(Model.ColumnType.String))
						.column('title', column => column.type(Model.ColumnType.String))
				)
				.buildSchema(),
			query: GQL`
        query {
          PostLocale(where: {post: "${testUuid(1)}", locale: "cs"}) {
            id
          }
        }`,
			executes: [
				...sqlTransaction([
					{
						sql: SQL`select "root_"."id" as "root_id"
                     from "post_locale" as "root_"
                     where "root_"."locale" = $1 and "root_"."post_id" = $2`,
						parameters: ['cs', testUuid(1)],
						response: [{ root_id: testUuid(2) }]
					}
				])
			],
			return: {
				data: {
					PostLocale: {
						id: testUuid(2)
					}
				}
			}
		})
	})

	it('Field alias', async () => {
		await execute({
			schema: new SchemaBuilder()
				.entity('Post', entity => entity.column('title', column => column.type(Model.ColumnType.String)))
				.buildSchema(),
			query: GQL`
        query {
          Post(where: {id: "${testUuid(1)}"}) {
            heading: title
          }
        }`,
			executes: [
				...sqlTransaction([
					{
						sql: SQL`select
                       "root_"."id" as "root_id",
                       "root_"."title" as "root_heading"
                     from "post" as "root_"
                     where "root_"."id" = $1`,
						response: [{ root_heading: 'Hello' }],
						parameters: [testUuid(1)]
					}
				])
			],
			return: {
				data: {
					Post: {
						heading: 'Hello'
					}
				}
			}
		})
	})

	it('Posts with locales query (one has many)', async () => {
		await execute({
			schema: new SchemaBuilder()
				.entity('Post', entity =>
					entity.oneHasMany('locales', relation => relation.target('PostLocale').ownedBy('post'))
				)
				.entity('PostLocale', entity =>
					entity
						.column('locale', column => column.type(Model.ColumnType.String))
						.column('title', column => column.type(Model.ColumnType.String))
				)
				.buildSchema(),
			query: GQL`
        query {
          Posts {
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
				...sqlTransaction([
					{
						sql: SQL`select "root_"."id" as "root_id",
                       "root_"."id" as "root_id"
                     from "post" as "root_"`,
						response: [{ root_id: testUuid(1) }, { root_id: testUuid(2) }]
					},
					{
						sql: SQL`select
                       "root_"."post_id" as "__grouping_key",
                       "root_"."id" as "root_id",
                       "root_"."locale" as "root_locale",
                       "root_"."title" as "root_title"
                     from "post_locale" as "root_"
                     where "root_"."post_id" in ($1, $2)`,
						parameters: [testUuid(1), testUuid(2)],
						response: [
							{ root_id: testUuid(3), root_locale: 'cs', root_title: 'ahoj svete', __grouping_key: testUuid(1) },
							{ root_id: testUuid(4), root_locale: 'en', root_title: 'hello world', __grouping_key: testUuid(1) },
							{ root_id: testUuid(5), root_locale: 'cs', root_title: 'dalsi clanek', __grouping_key: testUuid(2) }
						]
					}
				])
			],
			return: {
				data: {
					Posts: [
						{
							id: testUuid(1),
							locales: [
								{
									id: testUuid(3),
									locale: 'cs',
									title: 'ahoj svete'
								},
								{
									id: testUuid(4),
									locale: 'en',
									title: 'hello world'
								}
							]
						},
						{
							id: testUuid(2),
							locales: [
								{
									id: testUuid(5),
									locale: 'cs',
									title: 'dalsi clanek'
								}
							]
						}
					]
				}
			}
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
          Posts {
            id
            author {
              id
              name
            }
          }
        }`,
			executes: [
				...sqlTransaction([
					{
						sql: SQL`
              select
                "root_"."id" as "root_id",
                "root_"."author_id" as "root_author"
              from "post" as "root_"
          `,
						response: [
							{
								root_id: testUuid(1),
								root_author: testUuid(2)
							},
							{
								root_id: testUuid(3),
								root_author: testUuid(4)
							}
						]
					},
					{
						sql: SQL`
              select
                "root_"."id" as "root_id",
                "root_"."id" as "root_id",
                "root_"."name" as "root_name"
              from "author" as "root_"
              where "root_"."id" in ($1, $2)
          `,
						parameters: [testUuid(2), testUuid(4)],
						response: [
							{
								root_id: testUuid(2),
								root_name: 'John'
							},
							{
								root_id: testUuid(4),
								root_name: 'Jack'
							}
						]
					}
				])
			],
			return: {
				data: {
					Posts: [
						{
							id: testUuid(1),
							author: {
								id: testUuid(2),
								name: 'John'
							}
						},
						{
							id: testUuid(3),
							author: {
								id: testUuid(4),
								name: 'Jack'
							}
						}
					]
				}
			}
		})
	})

	it('Sites with settings (one-has-one owner)', async () => {
		await execute({
			schema: new SchemaBuilder()
				.entity('Site', entity =>
					entity
						.column('name', column => column.type(Model.ColumnType.String))
						.manyHasOne('setting', relation => relation.target('SiteSetting'))
				)
				.entity('SiteSetting', entity => entity.column('url', column => column.type(Model.ColumnType.String)))
				.buildSchema(),
			query: GQL`query {
        Sites {
          id
          name
          setting {
            id
            url
          }
        }
      }`,
			executes: [
				...sqlTransaction([
					{
						sql: SQL`
                select
                  "root_"."id" as "root_id",
                  "root_"."name" as "root_name",
                  "root_"."setting_id" as "root_setting"
                from "site" as "root_"`,

						response: [
							{
								root_id: testUuid(1),
								root_name: 'Site 1',
								root_setting: testUuid(2)
							},
							{
								root_id: testUuid(3),
								root_name: 'Site 2',
								root_setting: testUuid(4)
							}
						]
					},
					{
						sql: SQL`
                select
                  "root_"."id" as "root_id",
                  "root_"."id" as "root_id",
                  "root_"."url" as "root_url"
                from "site_setting" as "root_"
                where "root_"."id" in ($1, $2)
              `,
						parameters: [testUuid(2), testUuid(4)],
						response: [
							{
								root_id: testUuid(2),
								root_url: 'http://site1.cz'
							},
							{
								root_id: testUuid(4),
								root_url: 'http://site2.cz'
							}
						]
					}
				])
			],
			return: {
				data: {
					Sites: [
						{
							id: testUuid(1),
							name: 'Site 1',
							setting: {
								id: testUuid(2),
								url: 'http://site1.cz'
							}
						},
						{
							id: testUuid(3),
							name: 'Site 2',
							setting: {
								id: testUuid(4),
								url: 'http://site2.cz'
							}
						}
					]
				}
			}
		})
	})

	it('Settings with sites (one-has-one inversed)', async () => {
		await execute({
			schema: new SchemaBuilder()
				.entity('Site', entity =>
					entity
						.column('name', column => column.type(Model.ColumnType.String))
						.oneHasOne('setting', relation => relation.target('SiteSetting').inversedBy('site'))
				)
				.entity('SiteSetting', entity => entity.column('url', column => column.type(Model.ColumnType.String)))
				.buildSchema(),
			query: GQL`query {
        SiteSettings {
          id
          url
          site {
            id
            name
          }
        }
      }`,
			executes: [
				...sqlTransaction([
					{
						sql: SQL`select
                       "root_"."id" as "root_id",
                       "root_"."id" as "root_id",
                       "root_"."url" as "root_url"
                     from "site_setting" as "root_"`,
						response: [
							{
								root_id: testUuid(1),
								root_url: 'http://site1.cz'
							},
							{
								root_id: testUuid(3),
								root_url: 'http://site2.cz'
							}
						]
					},
					{
						sql: SQL`select
                       "root_"."setting_id" as "root_setting",
                       "root_"."id" as "root_id",
                       "root_"."name" as "root_name"
                     from "site" as "root_"
                     where "root_"."setting_id" in ($1, $2)`,
						parameters: [testUuid(1), testUuid(3)],
						response: [
							{
								root_id: testUuid(2),
								root_setting: testUuid(1),
								root_name: 'Site 1'
							},
							{
								root_id: testUuid(4),
								root_setting: testUuid(3),
								root_name: 'Site 2'
							}
						]
					}
				])
			],
			return: {
				data: {
					SiteSettings: [
						{
							id: testUuid(1),
							url: 'http://site1.cz',
							site: {
								id: testUuid(2),
								name: 'Site 1'
							}
						},
						{
							id: testUuid(3),
							url: 'http://site2.cz',
							site: {
								name: 'Site 2',
								id: testUuid(4)
							}
						}
					]
				}
			}
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
						.oneHasMany('locales', relation => relation.target('CategoryLocale'))
				)
				.entity('CategoryLocale', entity =>
					entity
						.column('name', column => column.type(Model.ColumnType.String))
						.column('locale', column => column.type(Model.ColumnType.Enum, { enumName: 'locale' }))
				)
				.buildSchema(),
			query: GQL`
        query {
          Posts {
            id
            categories {
              id
              visible
              locales(where: {locale: {eq: cs}}) {
                id
                name
              }
            }
          }
        }`,
			executes: [
				...sqlTransaction([
					{
						sql: SQL`select 
                       "root_"."id" as "root_id",
                       "root_"."id" as "root_id"
                     from "post" as "root_"`,
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
						sql: SQL`select "category_id",
                       "post_id"
                     from "post_categories"
                     where "post_categories"."post_id" in ($1, $2)`,
						parameters: [testUuid(1), testUuid(2)],
						response: [
							{
								category_id: testUuid(3),
								post_id: testUuid(1)
							},
							{
								category_id: testUuid(4),
								post_id: testUuid(1)
							},
							{
								category_id: testUuid(5),
								post_id: testUuid(2)
							},
							{
								category_id: testUuid(3),
								post_id: testUuid(2)
							}
						]
					},
					{
						sql: SQL`select "root_"."id" as "root_id",  
                       "root_"."visible" as "root_visible",
                       "root_"."id" as "root_id"
                     from "category" as "root_"
                     where "root_"."id" in ($1, $2, $3)`,
						parameters: [testUuid(3), testUuid(4), testUuid(5)],
						response: [
							{
								root_id: testUuid(3),
								root_visible: true
							},
							{
								root_id: testUuid(4),
								root_visible: true
							},
							{
								root_id: testUuid(5),
								root_visible: true
							}
						]
					},
					{
						sql: SQL`
              select
                "root_"."category_id" as "__grouping_key",
                "root_"."id" as "root_id",
                "root_"."name" as "root_name"
              from "category_locale" as "root_"
              where "root_"."locale" = $1 and "root_"."category_id" in ($2, $3, $4)
          `,
						parameters: ['cs', testUuid(3), testUuid(4), testUuid(5)],
						response: [
							{
								root_id: testUuid(6),
								root_name: 'Kategorie 1',
								__grouping_key: testUuid(3)
							},
							{
								root_id: testUuid(7),
								root_name: 'Kategorie 2',
								__grouping_key: testUuid(4)
							},
							{
								root_id: testUuid(8),
								root_name: 'Kategorie 3',
								__grouping_key: testUuid(5)
							}
						]
					}
				])
			],
			return: {
				data: {
					Posts: [
						{
							categories: [
								{
									id: testUuid(3),
									visible: true,
									locales: [
										{
											id: testUuid(6),
											name: 'Kategorie 1'
										}
									]
								},
								{
									id: testUuid(4),
									visible: true,
									locales: [
										{
											id: testUuid(7),
											name: 'Kategorie 2'
										}
									]
								}
							],
							id: testUuid(1)
						},
						{
							categories: [
								{
									id: testUuid(5),
									visible: true,
									locales: [
										{
											id: testUuid(8),
											name: 'Kategorie 3'
										}
									]
								},
								{
									id: testUuid(3),
									visible: true,
									locales: [
										{
											id: testUuid(6),
											name: 'Kategorie 1'
										}
									]
								}
							],
							id: testUuid(2)
						}
					]
				}
			}
		})
	})

	it('Categories with posts and author (many has many inversed + many has one)', async () => {
		await execute({
			schema: new SchemaBuilder()
				.entity('Post', entity =>
					entity
						.manyHasMany('categories', relation => relation.target('Category').inversedBy('posts'))
						.manyHasOne('author', relation => relation.target('Author'))
				)
				.entity('Category', entity => entity.pluralName('Categories'))
				.entity('Author', entity => entity.column('name', column => column.type(Model.ColumnType.String)))
				.buildSchema(),
			query: GQL`
        query {
          Categories {
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
				...sqlTransaction([
					{
						sql: SQL`select
                       "root_"."id" as "root_id",
                       "root_"."id" as "root_id"
                     from "category" as "root_"`,
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
                       "category_id",
                       "post_id"
                     from "post_categories"
                     where "post_categories"."category_id" in ($1, $2)`,
						parameters: [testUuid(1), testUuid(2)],
						response: [
							{
								category_id: testUuid(1),
								post_id: testUuid(3)
							},
							{
								category_id: testUuid(1),
								post_id: testUuid(4)
							},
							{
								category_id: testUuid(2),
								post_id: testUuid(4)
							},
							{
								category_id: testUuid(2),
								post_id: testUuid(5)
							}
						]
					},
					{
						sql: SQL`select
                       "root_"."id" as "root_id",
                       "root_"."author_id" as "root_author"
                     from "post" as "root_"
                     where "root_"."id" in ($1, $2, $3)
          `,
						parameters: [testUuid(3), testUuid(4), testUuid(5)],
						response: [
							{
								root_id: testUuid(3),
								root_author: testUuid(6)
							},
							{
								root_id: testUuid(4),
								root_author: testUuid(7)
							},
							{
								root_id: testUuid(5),
								root_author: testUuid(7)
							}
						]
					},
					{
						sql: SQL`select
                       "root_"."id" as "root_id",
                       "root_"."id" as "root_id",
                       "root_"."name" as "root_name"
                     from "author" as "root_"
                     where "root_"."id" in ($1, $2)
          `,
						parameters: [testUuid(6), testUuid(7)],
						response: [
							{
								root_id: testUuid(6),
								root_name: 'John'
							},
							{
								root_id: testUuid(7),
								root_name: 'Jack'
							}
						]
					}
				])
			],
			return: {
				data: {
					Categories: [
						{
							id: testUuid(1),
							posts: [
								{
									author: {
										name: 'John'
									},
									id: testUuid(3)
								},
								{
									author: {
										name: 'Jack'
									},
									id: testUuid(4)
								}
							]
						},
						{
							id: testUuid(2),
							posts: [
								{
									author: {
										name: 'Jack'
									},
									id: testUuid(4)
								},
								{
									author: {
										name: 'Jack'
									},
									id: testUuid(5)
								}
							]
						}
					]
				}
			}
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
          Posts(where: {author: {name: {eq: "John"}}}) {
            id
          }
        }`,
			executes: [
				...sqlTransaction([
					{
						sql: SQL`select
                       "root_"."id" as "root_id",
                       "root_author"."id" as "root_author_id"
                     from "post" as "root_" left join "author" as "root_author" on "root_"."author_id" = "root_author"."id"
                     where "root_author"."name" = $1`,
						parameters: ['John'],
						response: [
							{
								root_id: testUuid(1)
							},
							{
								root_id: testUuid(3)
							}
						]
					}
				])
			],
			return: {
				data: {
					Posts: [
						{
							id: testUuid(1)
						},
						{
							id: testUuid(3)
						}
					]
				}
			}
		})
	})

	it('Author by post title (where many has one)', async () => {
		await execute({
			schema: new SchemaBuilder()
				.entity('Post', entity =>
					entity
						.manyHasOne('author', relation => relation.target('Author').inversedBy('posts'))
						.column('title', column => column.type(Model.ColumnType.String))
				)
				.entity('Author', entity => entity.column('name', column => column.type(Model.ColumnType.String)))
				.buildSchema(),
			query: GQL`
        query {
          Authors(where: {posts: {title: {eq: "Hello"}}}) {
            id
          }
        }`,
			executes: [
				...sqlTransaction([
					{
						sql: SQL`select "root_"."id" as "root_id"
                     from "author" as "root_"
                     where "root_"."id" in (select "root_"."author_id"
                                            from "post" as "root_"
                                            where "root_"."title" = $1)`,
						parameters: ['Hello'],
						response: [
							{
								root_id: testUuid(1)
							},
							{
								root_id: testUuid(3)
							}
						]
					}
				])
			],
			return: {
				data: {
					Authors: [
						{
							id: testUuid(1)
						},
						{
							id: testUuid(3)
						}
					]
				}
			}
		})
	})

	it('Post by category name (where many has many owner)', async () => {
		await execute({
			schema: new SchemaBuilder()
				.entity('Post', entity =>
					entity.manyHasMany('categories', relation =>
						relation.target('Category', e => e.column('name', c => c.type(Model.ColumnType.String)))
					)
				)
				.buildSchema(),
			query: GQL`
        query {
          Posts(where: {categories: {name: {eq: "Stuff"}}}) {
            id
          }
        }`,
			executes: [
				...sqlTransaction([
					{
						sql: SQL`select "root_"."id" as "root_id"
                     from "post" as "root_"
                     where "root_"."id" in (select "junction_"."post_id"
                                            from "post_categories" as "junction_" inner join "category" as "root_" on "junction_"."category_id" = "root_"."id"
                                            where "root_"."name" = $1)`,
						parameters: ['Stuff'],
						response: [
							{
								root_id: testUuid(1)
							},
							{
								root_id: testUuid(3)
							}
						]
					}
				])
			],
			return: {
				data: {
					Posts: [
						{
							id: testUuid(1)
						},
						{
							id: testUuid(3)
						}
					]
				}
			}
		})
	})

	it('Post by category ids (where many has many owner)', async () => {
		await execute({
			schema: new SchemaBuilder()
				.entity('Post', entity =>
					entity.manyHasMany('categories', relation =>
						relation.target('Category', e => e.column('name', c => c.type(Model.ColumnType.String)))
					)
				)
				.buildSchema(),
			query: GQL`
        query {
          Posts(where: {categories: {id: {in: ["${testUuid(10)}", "${testUuid(11)}"]}}}) {
            id
          }
        }`,
			executes: [
				...sqlTransaction([
					{
						sql: SQL`select "root_"."id" as "root_id"
                     from "post" as "root_"
                     where "root_"."id" in (select "junction_"."post_id"
                                            from "post_categories" as "junction_" inner join "category" as "root_" on "junction_"."category_id" = "root_"."id"
                                            where "root_"."id" in ($1, $2))`,
						parameters: [testUuid(10), testUuid(11)],
						response: [
							{
								root_id: testUuid(1)
							},
							{
								root_id: testUuid(3)
							}
						]
					}
				])
			],
			return: {
				data: {
					Posts: [
						{
							id: testUuid(1)
						},
						{
							id: testUuid(3)
						}
					]
				}
			}
		})
	})

	it('Posts with locales query with where (one has many)', async () => {
		await execute({
			schema: new SchemaBuilder()
				.entity('Post', entity =>
					entity.oneHasMany('locales', relation => relation.target('PostLocale').ownedBy('post'))
				)
				.entity('PostLocale', entity =>
					entity
						.column('locale', column => column.type(Model.ColumnType.String))
						.column('title', column => column.type(Model.ColumnType.String))
				)
				.buildSchema(),
			query: GQL`
        query {
          Posts {
            id
            locales(where: {locale: {eq: "cs"}}) {
              id
              locale
              title
            }
          }
        }
      `,
			executes: [
				...sqlTransaction([
					{
						sql: SQL`select "root_"."id" as "root_id",
                       "root_"."id" as "root_id"
                     from "post" as "root_"`,
						response: [{ root_id: testUuid(1) }, { root_id: testUuid(2) }]
					},
					{
						sql: SQL`select
                       "root_"."post_id" as "__grouping_key",
                       "root_"."id" as "root_id",
                       "root_"."locale" as "root_locale",
                       "root_"."title" as "root_title"
                     from "post_locale" as "root_"
                     where "root_"."locale" = $1 and "root_"."post_id" in ($2, $3)`,
						parameters: ['cs', testUuid(1), testUuid(2)],
						response: [
							{ root_id: testUuid(3), root_locale: 'cs', root_title: 'ahoj svete', __grouping_key: testUuid(1) },
							{ root_id: testUuid(5), root_locale: 'cs', root_title: 'dalsi clanek', __grouping_key: testUuid(2) }
						]
					}
				])
			],
			return: {
				data: {
					Posts: [
						{
							id: testUuid(1),
							locales: [
								{
									id: testUuid(3),
									locale: 'cs',
									title: 'ahoj svete'
								}
							]
						},
						{
							id: testUuid(2),
							locales: [
								{
									id: testUuid(5),
									locale: 'cs',
									title: 'dalsi clanek'
								}
							]
						}
					]
				}
			}
		})
	})
})
