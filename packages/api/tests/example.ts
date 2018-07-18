import { expect } from "chai"
import { graphql } from "graphql"
import { maskErrors } from "graphql-errors"
import * as knex from "knex"
import * as mockKnex from "mock-knex"
import GraphQlSchemaBuilder from "../src/graphQLSchema/GraphQlSchemaBuilder"
import model from "./model"

const builder = new GraphQlSchemaBuilder(model)
const graphQLSchema = builder.build()

maskErrors(graphQLSchema)

const connection = knex({
  // debug: true,
  client: "pg",
})

mockKnex.mock(connection)
const tracker = mockKnex.getTracker()
tracker.install()

const genericTaggedString = (strings: TemplateStringsArray, ...values: string[]) => {
  return strings.reduce((combined, string, i) => {
    return combined + string + (i < values.length ? values[i] : "")
  }, "")
}
const SQL = (strings: TemplateStringsArray, ...values: string[]) => genericTaggedString(strings, ...values).replace(/\s+/g, " ").trim()
const GQL = genericTaggedString

interface SqlQuery
{
  sql: string
  response: object[]
}

interface Test
{
  query: string
  executes: SqlQuery[]
  return: object
}

const uuid = (number: number) => {
  return `123e4567-e89b-12d3-a456-` + number.toString().padStart(12, "0")
}

const execute = async (test: Test) => {
  tracker.install()
  tracker.on("query", (query, step) => {
    const queryDefinition = test.executes[step - 1]
    if (!queryDefinition) {
      throw new Error(`Unexpected query #${step} '${query.sql}'`)
    }
    expect(query.sql.replace(/\s+/g, " ")).equals(queryDefinition.sql)
    query.response(queryDefinition.response)

  })
  expect(await graphql(graphQLSchema, test.query, null, {db: connection})).deep.equal(test.return)
  tracker.uninstall()
}

describe("Queries", () => {

  it("Post by id query", async () => {
    await execute({
      query: GQL`
        query {
          Post(where: {id: "${uuid(1)}"}) {
            id
          }
        }`,
      executes: [
        {
          sql: SQL`SELECT
					   "Post"."id" AS "id"
				   FROM "Post" "Post"
				   WHERE "Post"."id" = '${uuid(1)}'`,
          response: [{id: uuid(1)}]
        }
      ],
      return: {
        data: {
          Post: {
            id: uuid(1),
          }
        }
      }
    })
  })

  it("Posts with locales query (one has many)", async () => {
    await execute({
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
        {
          sql: SQL`
			  SELECT "Posts"."id" AS "id"
			  FROM "Post" "Posts"`,
          response: [
            {id: uuid(1)},
            {id: uuid(2)},
          ]
        },
        {
          sql: SQL`
          SELECT "locales"."id" AS "id", "locales"."locale" AS "locale", "locales"."title" AS "title", "locales"."post_id" AS "post_id"
          FROM "PostLocale" "locales"
          WHERE "locales"."post_id" IN ('${uuid(1)}','${uuid(2)}')`,
          response: [
            {id: uuid(3), locale: "cs", title: "ahoj svete", post_id: uuid(1)},
            {id: uuid(4), locale: "en", title: "hello world", post_id: uuid(1)},
            {id: uuid(5), locale: "cs", title: "dalsi clanek", post_id: uuid(2)},
          ],
        }
      ],
      return: {
        data: {
          Posts: [
            {
              id: uuid(1),
              locales: [
                {
                  id: uuid(3),
                  locale: "cs",
                  title: "ahoj svete",
                },
                {
                  id: uuid(4),
                  locale: "en",
                  title: "hello world",
                }
              ]
            },
            {
              id: uuid(2),
              locales: [
                {
                  id: uuid(5),
                  locale: "cs",
                  title: "dalsi clanek",
                }
              ]
            }
          ]
        }
      }
    })
  })

  it("Post with author query (many has one)", async () => {
    await execute({
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
        {
          sql: SQL`SELECT
					   "Posts"."id" AS "id",
					   "author"."id" AS "author__id",
					   "author"."name" AS "author__name"
				   FROM "Post" "Posts" LEFT JOIN "Author" "author" ON "Posts".author_id = "author".id`,
          response: [
            {
              id: uuid(1),
              author__id: uuid(2),
              author__name: "John",
            },
            {
              id: uuid(3),
              author__id: uuid(4),
              author__name: "Jack",
            },
          ]
        }
      ],
      return: {
        data: {
          Posts: [
            {
              id: uuid(1),
              author: {
                id: uuid(2),
                name: "John",
              },
            },
            {
              id: uuid(3),
              author: {
                id: uuid(4),
                name: "Jack",
              },
            },
          ],
        }
      }
    })
  })

  it('Sites with settings (one-has-one owner)', async () => {
    await execute({
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
        {
          sql: SQL`SELECT
					   "Sites"."id" AS "id",
					   "Sites"."name" AS "name",
					   "setting"."id" AS "setting__id",
					   "setting"."url" AS "setting__url"
				   FROM "Site" "Sites" LEFT JOIN "SiteSetting" "setting"
						   ON "Sites".setting_id = "setting".id`,
          response: [
            {
              id: uuid(1),
              name: "Site 1",
              setting__id: uuid(2),
              setting__url: "http://site1.cz",
            },
            {
              id: uuid(3),
              name: "Site 2",
              setting__id: uuid(4),
              setting__url: "http://site2.cz",
            }
          ]
        }
      ],
      return: {
        data: {
          Sites: [
            {
              id: uuid(1),
              name: "Site 1",
              setting: {
                id: uuid(2),
                url: "http://site1.cz",
              },
            },
            {
              id: uuid(3),
              name: "Site 2",
              setting: {
                id: uuid(4),
                url: "http://site2.cz",
              },
            },
          ]
        }
      }
    })
  })

  it('Settings with sites (one-has-one inversed)', async () => {
    await execute({
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
        {
          sql: SQL`SELECT
					   "SiteSettin"."id" AS "id",
					   "SiteSettin"."url" AS "url",
					   "site"."id" AS "site__id",
					   "site"."name" AS "site__name"
				   FROM "SiteSetting" "SiteSettin"
					   LEFT JOIN "Site" "site" ON "SiteSettin".id = "site".setting_id`,
          response: [
            {
              id: uuid(1),
              url: "http://site1.cz",
              site__id: uuid(2),
              site__name: "Site 1",
            },
            {
              id: uuid(3),
              url: "http://site2.cz",
              site__id: uuid(4),
              site__name: "Site 2",
            }
          ]
        }
      ],
      return: {
        data: {
          SiteSettings: [
            {
              id: uuid(1),
              url: "http://site1.cz",
              site: {
                id: uuid(2),
                name: "Site 1",
              },
            },
            {
              id: uuid(3),
              url: "http://site2.cz",
              site: {
                name: "Site 2",
                id: uuid(4),
              },
            },
          ]
        }
      }
    })
  })

  it('Posts with categories and its cz locale (many has many owner + one has many)', async () => {
    await execute({
      query: GQL`
        query {
          Posts {
            id
            categories {
              id
              locales(where: {locale: {eq: cs}}) {
                id
                name
              }
            }
          }
        }`,
      executes: [
        {
          sql: SQL`SELECT "Posts"."id" AS "id"
				   FROM "Post" "Posts"`,
          response: [
            {
              id: uuid(1),
            },
            {
              id: uuid(2),
            },
          ]
        },
        {
          sql: SQL`SELECT
					   NULLIF(CONCAT("_PostCateg"."post_id", "_PostCateg"."category_id"), '') AS "pos#cat",
					   "categories"."id" AS "id",
					   "_PostCateg"."post_id" AS "post_id"
				   FROM "PostCategories" "_PostCateg"
					   LEFT JOIN "Category" "categories" ON "_PostCateg".category_id = "categories".id
				   WHERE "_PostCateg"."post_id" IN ('${uuid(1)}','${uuid(2)}')`,
          response: [
            {
              'pos#cat': uuid(1) + uuid(3),
              id: uuid(3),
              post_id: uuid(1),
            },
            {
              'pos#cat': uuid(1) + uuid(4),
              id: uuid(4),
              post_id: uuid(1),
            },
            {
              'pos#cat': uuid(2) + uuid(5),
              id: uuid(5),
              post_id: uuid(2),
            },
            {
              'pos#cat': uuid(2) + uuid(3),
              id: uuid(3),
              post_id: uuid(2),
            },
          ]
        },
        {
          sql: SQL`SELECT
					   "locales"."id" AS "id",
					   "locales"."name" AS "name",
					   "locales"."category_id" AS "category_id"
				   FROM "CategoryLocale" "locales"
				   WHERE "locales"."locale" = 'cs' AND "locales"."category_id" IN
						('${uuid(3)}','${uuid(4)}','${uuid(5)}')`,
          response: [
            {
              id: uuid(6),
              name: "Kategorie 1",
              category_id: uuid(3),
            },
            {
              id: uuid(7),
              name: "Kategorie 2",
              category_id: uuid(4),
            },
            {
              id: uuid(8),
              name: "Kategorie 3",
              category_id: uuid(5),
            },
          ]
        }
      ],
      return: {
        "data": {
          "Posts": [
            {
              "categories": [
                {
                  "id": uuid(3),
                  "locales": [
                    {
                      "id": uuid(6),
                      "name": "Kategorie 1"
                    },
                  ],
                },
                {
                  "id": uuid(4),
                  "locales": [
                    {
                      "id": uuid(7),
                      "name": "Kategorie 2",
                    },
                  ],
                },
              ],
              "id": uuid(1),
            },
            {
              "categories": [
                {
                  "id": uuid(5),
                  "locales": [
                    {
                      "id": uuid(8),
                      "name": "Kategorie 3",
                    },
                  ],
                },
                {
                  "id": uuid(3),
                  "locales": [
                    {
                      "id": uuid(6),
                      "name": "Kategorie 1",
                    },
                  ],
                },
              ],
              "id": uuid(2),
            },
          ],
        }
      }
    })
  })

  it('Categories with posts and author (many has many inversed + many has one)', async () => {
    await execute({
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
        {
          sql: SQL`SELECT "Categories"."id" AS "id"
				   FROM "Category" "Categories"`,
          response: [
            {
              id: uuid(1),
            },
            {
              id: uuid(2),
            },
          ]
        },
        {
          sql: SQL`SELECT
					   NULLIF(CONCAT("_PostCateg"."post_id", "_PostCateg"."category_id"), '') AS "pos#cat",
					   "posts"."id" AS "id",
					   "author"."id" AS "author__id",
					   "author"."name" AS "author__name",
					   "_PostCateg"."category_id" AS "category_id"
				   FROM "PostCategories" "_PostCateg"
					   LEFT JOIN "Post" "posts" ON "_PostCateg".post_id = "posts".id
					   LEFT JOIN "Author" "author" ON "posts".author_id = "author".id
				   WHERE "_PostCateg"."category_id" IN ('${uuid(1)}','${uuid(2)}')`,
          response: [
            {
              'pos#cat': uuid(3) + uuid(1),
              id: uuid(3),
              author__id: uuid(6),
              author__name: 'John',
              category_id: uuid(1),
            },
            {
              'pos#cat': uuid(4) + uuid(1),
              id: uuid(4),
              author__id: uuid(7),
              author__name: 'Jack',
              category_id: uuid(1),
            },
            {
              'pos#cat': uuid(4) + uuid(2),
              id: uuid(4),
              author__id: uuid(7),
              author__name: 'Jack',
              category_id: uuid(2),
            },
            {
              'pos#cat': uuid(5) + uuid(2),
              id: uuid(5),
              author__id: uuid(7),
              author__name: 'Jack',
              category_id: uuid(2),
            },
          ]
        }
      ],
      return: {
        "data": {
          "Categories": [
            {
              "id": uuid(1),
              "posts": [
                {
                  "author": {
                    "name": "John",
                  },
                  "id": uuid(3),
                },
                {
                  "author": {
                    "name": "Jack"
                  },
                  "id": uuid(4),
                },
              ],
            },
            {
              "id": uuid(2),
              "posts": [
                {
                  "author": {
                    "name": "Jack",
                  },
                  "id": uuid(4)
                },
                {
                  "author": {
                    "name": "Jack"
                  },
                  "id": uuid(5),
                },
              ],
            }
          ]
        }
      }
    })
  })
})
