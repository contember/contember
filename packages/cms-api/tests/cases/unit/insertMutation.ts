import { execute } from "../../src/test";
import { GQL, SQL } from "../../src/tags";
import { testUuid } from "../../src/testUuid";
import SchemaBuilder from "../../../src/schema/builder/SchemaBuilder";
import 'mocha'

describe('Insert mutation', () => {
  it('insert author (no relations)', async () => {
    await execute({
      schema: new SchemaBuilder()
        .entity("Author", entity => entity
          .column("name", c => c.type('string'))
        )
        .buildSchema(),
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
          sql: SQL`insert into "author" ("id", "name") values ($1, $2)
		  returning "id"`,
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
            FROM "author" "createAuth"
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
      schema: new SchemaBuilder()
        .entity("Site", entity => entity
          .column("name", c => c.type('string'))
          .oneHasOne('setting', r => r.target('SiteSetting').inversedBy('site'))
        )
        .entity('SiteSetting', e => e
          .column('url', c => c.type('string'))
        )
        .buildSchema(),
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
          sql: SQL`insert into "site_setting" ("id", "url") values ($1, $2)
		  returning "id"`,
          parameters: [testUuid(2), "https://mangoweb.cz"],
          response: [testUuid(2),]
        },
        {
          sql: SQL`insert into "site" ("id", "name", "setting_id") values ($1, $2, $3)
		  returning "id"`,
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
            FROM "site" "createSite" 
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
      schema: new SchemaBuilder()
        .entity("Site", entity => entity
          .column("name", c => c.type('string'))
          .oneHasOne('setting', r => r.target('SiteSetting').inversedBy('site'))
        )
        .entity('SiteSetting', e => e
          .column('url', c => c.type('string'))
        )
        .buildSchema(),
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
          sql: SQL`insert into "site_setting" ("id", "url") values ($1, $2)
		  returning "id"`,
          parameters: [testUuid(1), "https://mangoweb.cz"],
          response: [testUuid(1),]
        },
        {
          sql: SQL`insert into "site" ("id", "name", "setting_id") values ($1, $2, $3)
		  returning "id"`,
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
            FROM "site_setting" "createSite" 
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

  it('insert posts with author (many has one)', async () => {
    await execute({
      schema: new SchemaBuilder()
        .entity("Post", e => e
          .column("publishedAt", c => c.type("datetime"))
          .manyHasOne("author", r => r.target("Author"))
        )
        .entity("Author", e => e
          .column("name", c => c.type('string'))
        )
        .buildSchema(),
      query: GQL`
        mutation {
          createPost(data: {
            publishedAt: "2018-06-11",
            author: {create: {name: "John"}}
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
          sql: SQL`insert into "author" ("id", "name") values ($1, $2)
		  returning "id"`,
          parameters: [testUuid(2), 'John'],
          response: [testUuid(2)],
        },
        {
          sql: SQL`insert into "post" ("author_id", "id", "published_at") values ($1, $2, $3)
		  returning "id"`,
          parameters: [testUuid(2), testUuid(1), '2018-06-11'],
          response: [testUuid(1)],
        },
        {
          sql: 'COMMIT;',
        },
        {
          sql: SQL`
            SELECT "createPost"."id" AS "id"
            FROM "post" "createPost"
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


  it('insert posts with locales (one has many)', async () => {
    await execute({
      schema: new SchemaBuilder()
        .enum('locale', ['cs', 'en'])
        .entity("Post", e => e
          .column("publishedAt", c => c.type("datetime"))
          .oneHasMany("locales", r => r.target("PostLocale"))
        )
        .entity('PostLocale', e => e
          .column('locale', c => c.type('locale'))
          .column('title', c => c.type('string'))
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
            id
          }
        }
      `,
      executes: [
        {
          sql: SQL`BEGIN;`,
        },
        {
          sql: SQL`insert into "post" ("id", "published_at") values ($1, $2)
		  returning "id"`,
          parameters: [testUuid(1), '2018-06-11'],
          response: [testUuid(1)],
        },
        {
          sql: SQL`insert into "post_locale" ("id", "locale", "post_id", "title") values ($1, $2, $3, $4)
		  returning "id"`,
          parameters: [testUuid(2), 'cs', testUuid(1), 'Ahoj svete'],
          response: [testUuid(2)],
        },
        {
          sql: SQL`insert into "post_locale" ("id", "locale", "post_id", "title") values ($1, $2, $3, $4)
		  returning "id"`,
          parameters: [testUuid(3), 'en', testUuid(1), 'Hello world'],
          response: [testUuid(3)],
        },
        {
          sql: 'COMMIT;',
        },
        {
          sql: SQL`
            SELECT "createPost"."id" AS "id"
            FROM "post" "createPost"
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

  it('insert post with categories (many has many, owning)', async () => {
    await execute({
      schema: new SchemaBuilder()
        .entity("Post", e => e
          .column('name', c => c.type('string'))
          .manyHasMany('categories', r => r.target('Category'))
        )
        .entity('Category', e => e
          .column('name', c => c.type('string'))
        )
        .buildSchema(),
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
          sql: SQL`insert into "post" ("id", "name") values ($1, $2)
		  returning "id"`,
          parameters: [testUuid(1), 'Hello world'],
          response: [testUuid(1)],
        },
        {
          sql: SQL`insert into "category" ("id", "name") values ($1, $2)
		  returning "id"`,
          parameters: [testUuid(2), 'Category 1'],
          response: [testUuid(2)],
        },
        {
          sql: SQL`insert into "category" ("id", "name") values ($1, $2)
		  returning "id"`,
          parameters: [testUuid(3), 'Category 2'],
          response: [testUuid(3)],
        },
        {
          sql: SQL`insert into "post_categories" ("category_id", "post_id") values ($1, $2)`,
          parameters: [testUuid(2), testUuid(1)],
        },
        {
          sql: SQL`insert into "post_categories" ("category_id", "post_id") values ($1, $2)`,
          parameters: [testUuid(3), testUuid(1)],
        },
        {
          sql: SQL`COMMIT;`,
        },
        {
          sql: SQL`SELECT "createPost"."id" AS "id" FROM "post" "createPost" WHERE "createPost"."id" = '${testUuid(1)}'`,
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
      schema: new SchemaBuilder()
        .entity("Post", e => e
          .column('name', c => c.type('string'))
          .manyHasMany('categories', r => r.target('Category').inversedBy('posts'))
        )
        .entity('Category', e => e
          .column('name', c => c.type('string'))
        )
        .buildSchema(),
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
          sql: SQL`insert into "category" ("id", "name") values ($1, $2)
		  returning "id"`,
          parameters: [testUuid(1), 'Hello world'],
          response: [testUuid(1)],
        },
        {
          sql: SQL`insert into "post" ("id", "name") values ($1, $2)
		  returning "id"`,
          parameters: [testUuid(2), 'Post 1'],
          response: [testUuid(2)],
        },
        {
          sql: SQL`insert into "post" ("id", "name") values ($1, $2)
		  returning "id"`,
          parameters: [testUuid(3), 'Post 2'],
          response: [testUuid(3)],
        },
        {
          sql: SQL`insert into "post_categories" ("category_id", "post_id") values ($1, $2)`,
          parameters: [testUuid(1), testUuid(2)],
        },
        {
          sql: SQL`insert into "post_categories" ("category_id", "post_id") values ($1, $2)`,
          parameters: [testUuid(1), testUuid(3)],
        },
        {
          sql: SQL`COMMIT;`,
        },
        {
          sql: SQL`SELECT "createCate"."id" AS "id" FROM "category" "createCate" WHERE "createCate"."id" = '${testUuid(1)}'`,
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
