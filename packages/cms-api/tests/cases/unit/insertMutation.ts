import { execute } from "../../src/test";
import { GQL, SQL } from "../../src/tags";
import { testUuid } from "../../src/testUuid";
import { OnDelete, RelationType, Schema } from "../../../src/schema/model";

describe('Insert mutation', () => {
  it('insert author (no relations)', async () => {
    await execute({
      query: GQL`
        mutation {
          createAuthor(data: {name: "John"}) {
            id
          }
        }`,
      executes: [
        {
          sql: SQL`BEGIN;`,
          response: [],
        },
        {
          sql: SQL`insert into "Author" ("id", "name") values ($1, $2) returning "id"`,
          parameters: [testUuid(1), "John"],
          response: [testUuid(1),]
        },
        {
          sql: SQL`COMMIT;`,
          response: [],
        },
        {
          sql: SQL`
            SELECT "createAuth"."id" AS "id"
            FROM "Author" "createAuth"
            WHERE "createAuth"."id" = '${testUuid(1)}'
          `,
          response: [{id: testUuid(1)}],
        }
      ],
      return: {
        "data": {
          "createAuthor": {
            "id": testUuid(1),
          },
        }
      }
    })
  })


  it('insert site with settings (one has one owner relation', async () => {
    await execute({
      query: GQL`
        mutation {
          createSite(data: {name: "Mangoweb", setting: {create: {url: "https://mangoweb.cz"}}}) {
            id
          }
        }`,
      executes: [
        {
          sql: SQL`BEGIN;`,
          response: [],
        },
        {
          sql: SQL`insert into "SiteSetting" ("id", "url") values ($1, $2) returning "id"`,
          parameters: [testUuid(2), "https://mangoweb.cz"],
          response: [testUuid(2),]
        },
        {
          sql: SQL`insert into "Site" ("id", "name", "setting_id") values ($1, $2, $3) returning "id"`,
          parameters: [testUuid(1), "Mangoweb", testUuid(2)],
          response: [testUuid(1),]
        },
        {
          sql: SQL`COMMIT;`,
          response: [],
        },
        {
          sql: SQL`
            SELECT "createSite"."id" AS "id"
            FROM "Site" "createSite" 
            WHERE "createSite"."id" = '${testUuid(1)}'
          `,
          response: [{id: testUuid(1)}],
        }
      ],
      return: {
        "data": {
          "createSite": {
            "id": testUuid(1),
          },
        }
      }
    })
  })


  it('insert setting with site (one has one inversed relation)', async () => {
    await execute({
      query: GQL`
        mutation {
          createSiteSetting(data: {url: "https://mangoweb.cz", site: {create: {name: "Mangoweb"}}}) {
            id
          }
        }`,
      executes: [
        {
          sql: SQL`BEGIN;`,
          response: [],
        },
        {
          sql: SQL`insert into "SiteSetting" ("id", "url") values ($1, $2) returning "id"`,
          parameters: [testUuid(1), "https://mangoweb.cz"],
          response: [testUuid(1),]
        },
        {
          sql: SQL`insert into "Site" ("id", "name", "setting_id") values ($1, $2, $3) returning "id"`,
          parameters: [testUuid(2), "Mangoweb", testUuid(1)],
          response: [testUuid(2),]
        },
        {
          sql: SQL`COMMIT;`,
          response: [],
        },
        {
          sql: SQL`
            SELECT "createSite"."id" AS "id"
            FROM "SiteSetting" "createSite" 
            WHERE "createSite"."id" = '${testUuid(1)}'
          `,
          response: [{id: testUuid(1)}],
        }
      ],
      return: {
        "data": {
          "createSiteSetting": {
            "id": testUuid(1),
          },
        }
      }
    })
  })

  it('insert posts with locales and author (one has many + many has one)', async () => {
    await execute({
      query: GQL`
        mutation {
          createPost(data: {
            publishedAt: "2018-06-11",
            author: {create: {name: "John"}}
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
        {
          sql: SQL`BEGIN;`,
        },
        {
          sql: SQL`insert into "Author" ("id", "name") values ($1, $2) returning "id"`,
          parameters: [testUuid(2), 'John'],
          response: [testUuid(2)],
        },
        {
          sql: SQL`insert into "Post" ("author_id", "id", "publishedAt") values ($1, $2, $3) returning "id"`,
          parameters: [testUuid(2), testUuid(1), '2018-06-11'],
          response: [testUuid(1)],
        },
        {
          sql: SQL`insert into "PostLocale" ("id", "locale", "post_id", "title") values ($1, $2, $3, $4) returning "id"`,
          parameters: [testUuid(3), 'cs', testUuid(1), 'Ahoj svete'],
          response: [testUuid(3)],
        },
        {
          sql: SQL`insert into "PostLocale" ("id", "locale", "post_id", "title") values ($1, $2, $3, $4) returning "id"`,
          parameters: [testUuid(4), 'en', testUuid(1), 'Hello world'],
          response: [testUuid(4)],
        },
        {
          sql: 'COMMIT;',
        },
        {
          sql: SQL`
            SELECT "createPost"."id" AS "id"
            FROM "Post" "createPost"
            WHERE "createPost"."id" = '${testUuid(1)}'
          `,
          response: [{id: testUuid(1),}]
        }
      ],
      return: {
        "data": {
          "createPost": {
            "id": testUuid(1),
          },
        }
      }
    })
  })

  const postWithCategorySchema: Schema = {
    enums: {},
    entities: {
      Category: {
        name: "Category",
        pluralName: "Categories",
        primary: "id",
        primaryColumn: "id",
        tableName: "Category",
        fields: {
          id: {name: "id", type: "uuid", columnName: "id"},
          name: {name: "name", type: "string", columnName: "name"},
          posts: {name: "posts", relation: RelationType.ManyHasMany, target: "Post", ownedBy: "categories"},
        }
      },
      Post: {
        name: "Post",
        primary: "id",
        primaryColumn: "id",
        tableName: "Post",
        fields: {
          id: {name: "id", type: "uuid", columnName: "id"},
          name: {name: "name", type: "string", columnName: "name"},
          categories: {
            name: "categories",
            relation: RelationType.ManyHasMany,
            target: "Category",
            inversedBy: "posts",
            joiningTable: {
              tableName: "PostCategories",
              joiningColumn: {
                columnName: "post_id",
                onDelete: OnDelete.cascade
              },
              inverseJoiningColumn: {
                columnName: "category_id",
                onDelete: OnDelete.cascade
              }
            }
          },
        }
      },
    }
  }
  it('insert post with categories (many has many, owning)', async () => {
    await execute({
      schema: postWithCategorySchema,
      query: GQL`
        mutation {
          createPost(data: {name: "Hello world", categories: [{create: {name: "Category 1"}}, {create: {name: "Category 2"}}]}) {
            id
          }
        }
      `,
      executes: [
        {
          sql: SQL`BEGIN;`,
        },
        {
          sql: SQL`insert into "Post" ("id", "name") values ($1, $2) returning "id"`,
          parameters: [testUuid(1), 'Hello world'],
          response: [testUuid(1)],
        },
        {
          sql: SQL`insert into "Category" ("id", "name") values ($1, $2) returning "id"`,
          parameters: [testUuid(2), 'Category 1'],
          response: [testUuid(2)],
        },
        {
          sql: SQL`insert into "Category" ("id", "name") values ($1, $2) returning "id"`,
          parameters: [testUuid(3), 'Category 2'],
          response: [testUuid(3)],
        },
        {
          sql: SQL`insert into "PostCategories" ("category_id", "post_id") values ($1, $2)`,
          parameters: [testUuid(2), testUuid(1)],
        },
        {
          sql: SQL`insert into "PostCategories" ("category_id", "post_id") values ($1, $2)`,
          parameters: [testUuid(3), testUuid(1)],
        },
        {
          sql: SQL`COMMIT;`,
        },
        {
          sql: SQL`SELECT "createPost"."id" AS "id" FROM "Post" "createPost" WHERE "createPost"."id" = '${testUuid(1)}'`,
          response: [{id: testUuid(1)}],
        }
      ],
      return: {
        "data": {
          "createPost": {
            "id": testUuid(1),
          }
        }
      }
    })
  })

  it('insert category with posts (many has many, inversed)', async () => {
    await execute({
      schema: postWithCategorySchema,
      query: GQL`
        mutation {
          createCategory(data: {name: "Hello world", posts: [{create: {name: "Post 1"}}, {create: {name: "Post 2"}}]}) {
            id
          }
        }
      `,
      executes: [
        {
          sql: SQL`BEGIN;`,
        },
        {
          sql: SQL`insert into "Category" ("id", "name") values ($1, $2) returning "id"`,
          parameters: [testUuid(1), 'Hello world'],
          response: [testUuid(1)],
        },
        {
          sql: SQL`insert into "Post" ("id", "name") values ($1, $2) returning "id"`,
          parameters: [testUuid(2), 'Post 1'],
          response: [testUuid(2)],
        },
        {
          sql: SQL`insert into "Post" ("id", "name") values ($1, $2) returning "id"`,
          parameters: [testUuid(3), 'Post 2'],
          response: [testUuid(3)],
        },
        {
          sql: SQL`insert into "PostCategories" ("category_id", "post_id") values ($1, $2)`,
          parameters: [testUuid(1), testUuid(2)],
        },
        {
          sql: SQL`insert into "PostCategories" ("category_id", "post_id") values ($1, $2)`,
          parameters: [testUuid(1), testUuid(3)],
        },
        {
          sql: SQL`COMMIT;`,
        },
        {
          sql: SQL`SELECT "createCate"."id" AS "id" FROM "Category" "createCate" WHERE "createCate"."id" = '${testUuid(1)}'`,
          response: [{id: testUuid(1)}],
        }
      ],
      return: {
        "data": {
          "createCategory": {
            "id": testUuid(1),
          }
        }
      }
    })
  })
})
