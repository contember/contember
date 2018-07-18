import { execute } from "../../src/test";
import { GQL, SQL } from "../../src/tags";
import { testUuid } from "../../src/testUuid";

describe("Queries", () => {

  it("Post by id query", async () => {
    await execute({
      query: GQL`
        query {
          Post(where: {id: "${testUuid(1)}"}) {
            id
          }
        }`,
      executes: [
        {
          sql: SQL`SELECT
             "Post"."id" AS "id"
           FROM "Post" "Post"
           WHERE "Post"."id" = '${testUuid(1)}'`,
          response: [{id: testUuid(1)}]
        }
      ],
      return: {
        data: {
          Post: {
            id: testUuid(1),
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
            {id: testUuid(1)},
            {id: testUuid(2)},
          ]
        },
        {
          sql: SQL`
          SELECT "locales"."id" AS "id", "locales"."locale" AS "locale", "locales"."title" AS "title", "locales"."post_id" AS "post_id"
          FROM "PostLocale" "locales"
          WHERE "locales"."post_id" IN ('${testUuid(1)}','${testUuid(2)}')`,
          response: [
            {id: testUuid(3), locale: "cs", title: "ahoj svete", post_id: testUuid(1)},
            {id: testUuid(4), locale: "en", title: "hello world", post_id: testUuid(1)},
            {id: testUuid(5), locale: "cs", title: "dalsi clanek", post_id: testUuid(2)},
          ],
        }
      ],
      return: {
        data: {
          Posts: [
            {
              id: testUuid(1),
              locales: [
                {
                  id: testUuid(3),
                  locale: "cs",
                  title: "ahoj svete",
                },
                {
                  id: testUuid(4),
                  locale: "en",
                  title: "hello world",
                }
              ]
            },
            {
              id: testUuid(2),
              locales: [
                {
                  id: testUuid(5),
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
              id: testUuid(1),
              author__id: testUuid(2),
              author__name: "John",
            },
            {
              id: testUuid(3),
              author__id: testUuid(4),
              author__name: "Jack",
            },
          ]
        }
      ],
      return: {
        data: {
          Posts: [
            {
              id: testUuid(1),
              author: {
                id: testUuid(2),
                name: "John",
              },
            },
            {
              id: testUuid(3),
              author: {
                id: testUuid(4),
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
              id: testUuid(1),
              name: "Site 1",
              setting__id: testUuid(2),
              setting__url: "http://site1.cz",
            },
            {
              id: testUuid(3),
              name: "Site 2",
              setting__id: testUuid(4),
              setting__url: "http://site2.cz",
            }
          ]
        }
      ],
      return: {
        data: {
          Sites: [
            {
              id: testUuid(1),
              name: "Site 1",
              setting: {
                id: testUuid(2),
                url: "http://site1.cz",
              },
            },
            {
              id: testUuid(3),
              name: "Site 2",
              setting: {
                id: testUuid(4),
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
              id: testUuid(1),
              url: "http://site1.cz",
              site__id: testUuid(2),
              site__name: "Site 1",
            },
            {
              id: testUuid(3),
              url: "http://site2.cz",
              site__id: testUuid(4),
              site__name: "Site 2",
            }
          ]
        }
      ],
      return: {
        data: {
          SiteSettings: [
            {
              id: testUuid(1),
              url: "http://site1.cz",
              site: {
                id: testUuid(2),
                name: "Site 1",
              },
            },
            {
              id: testUuid(3),
              url: "http://site2.cz",
              site: {
                name: "Site 2",
                id: testUuid(4),
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
              id: testUuid(1),
            },
            {
              id: testUuid(2),
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
           WHERE "_PostCateg"."post_id" IN ('${testUuid(1)}','${testUuid(2)}')`,
          response: [
            {
              'pos#cat': testUuid(1) + testUuid(3),
              id: testUuid(3),
              post_id: testUuid(1),
            },
            {
              'pos#cat': testUuid(1) + testUuid(4),
              id: testUuid(4),
              post_id: testUuid(1),
            },
            {
              'pos#cat': testUuid(2) + testUuid(5),
              id: testUuid(5),
              post_id: testUuid(2),
            },
            {
              'pos#cat': testUuid(2) + testUuid(3),
              id: testUuid(3),
              post_id: testUuid(2),
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
            ('${testUuid(3)}','${testUuid(4)}','${testUuid(5)}')`,
          response: [
            {
              id: testUuid(6),
              name: "Kategorie 1",
              category_id: testUuid(3),
            },
            {
              id: testUuid(7),
              name: "Kategorie 2",
              category_id: testUuid(4),
            },
            {
              id: testUuid(8),
              name: "Kategorie 3",
              category_id: testUuid(5),
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
                  "id": testUuid(3),
                  "locales": [
                    {
                      "id": testUuid(6),
                      "name": "Kategorie 1"
                    },
                  ],
                },
                {
                  "id": testUuid(4),
                  "locales": [
                    {
                      "id": testUuid(7),
                      "name": "Kategorie 2",
                    },
                  ],
                },
              ],
              "id": testUuid(1),
            },
            {
              "categories": [
                {
                  "id": testUuid(5),
                  "locales": [
                    {
                      "id": testUuid(8),
                      "name": "Kategorie 3",
                    },
                  ],
                },
                {
                  "id": testUuid(3),
                  "locales": [
                    {
                      "id": testUuid(6),
                      "name": "Kategorie 1",
                    },
                  ],
                },
              ],
              "id": testUuid(2),
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
              id: testUuid(1),
            },
            {
              id: testUuid(2),
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
           WHERE "_PostCateg"."category_id" IN ('${testUuid(1)}','${testUuid(2)}')`,
          response: [
            {
              'pos#cat': testUuid(3) + testUuid(1),
              id: testUuid(3),
              author__id: testUuid(6),
              author__name: 'John',
              category_id: testUuid(1),
            },
            {
              'pos#cat': testUuid(4) + testUuid(1),
              id: testUuid(4),
              author__id: testUuid(7),
              author__name: 'Jack',
              category_id: testUuid(1),
            },
            {
              'pos#cat': testUuid(4) + testUuid(2),
              id: testUuid(4),
              author__id: testUuid(7),
              author__name: 'Jack',
              category_id: testUuid(2),
            },
            {
              'pos#cat': testUuid(5) + testUuid(2),
              id: testUuid(5),
              author__id: testUuid(7),
              author__name: 'Jack',
              category_id: testUuid(2),
            },
          ]
        }
      ],
      return: {
        "data": {
          "Categories": [
            {
              "id": testUuid(1),
              "posts": [
                {
                  "author": {
                    "name": "John",
                  },
                  "id": testUuid(3),
                },
                {
                  "author": {
                    "name": "Jack"
                  },
                  "id": testUuid(4),
                },
              ],
            },
            {
              "id": testUuid(2),
              "posts": [
                {
                  "author": {
                    "name": "Jack",
                  },
                  "id": testUuid(4)
                },
                {
                  "author": {
                    "name": "Jack"
                  },
                  "id": testUuid(5),
                },
              ],
            }
          ]
        }
      }
    })
  })
})
