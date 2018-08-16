import { Model } from "cms-common"
import { execute } from "../../src/test";
import { GQL, SQL } from "../../src/tags";
import { testUuid } from "../../src/testUuid";
import SchemaBuilder from "../../../src/content-schema/builder/SchemaBuilder";
import 'mocha'

describe('Delete mutation', () => {
  it('delete post', async () => {
    await execute({
      schema: (new SchemaBuilder()
        .entity("Post", entity => entity
          .manyHasOne("author", relation => relation.target("Author"))
        )
        .entity("Author", entity => entity
          .column("name", column => column.type(Model.ColumnType.String))
        )
        .buildSchema()),
      query: GQL`
        mutation {
          deletePost(where: {id: "${testUuid(1)}"}) {
            id
            author {
              name
            }
          }
        }`,
      executes: [
        {
          sql: SQL`
            SELECT
              "deletePost"."id" AS "id",
              "author"."id" AS "author__id",
              "author"."name" AS "author__name"
            FROM "post" "deletePost"
            LEFT JOIN "author" "author" ON "deletePost".author_id = "author".id
            WHERE "deletePost"."id" = '${testUuid(1)}'
          `,
          response: [
            {
              id: testUuid(1),
              author__id: testUuid(2),
              author__name: "John",
            }
          ]
        },
        {
          sql: SQL`BEGIN;`,
          response: [],
        },
        {
          sql: SQL`delete from "post"
		  where "id" = $1`,
          parameters: [testUuid(1)],
          response: [],
        },
        {
          sql: SQL`COMMIT;`,
          response: [],
        },
      ],
      return: {
        "data": {
          "deletePost": {
            "author": {
              "name": "John",
            },
            "id": testUuid(1),
          },
        }
      }
    })
  })
})
