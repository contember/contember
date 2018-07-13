import { graphql } from "graphql";
import GraphQlSchemaBuilder from "../src/graphQLSchema/GraphQlSchemaBuilder";
import model from "../src/model";
import * as knex from 'knex'
import * as mockKnex from 'mock-knex'
import { expect } from 'chai'
import { maskErrors } from "graphql-errors";


const builder = new GraphQlSchemaBuilder(model)
let graphQLSchema = builder.build()

maskErrors(graphQLSchema)

const connection = knex({
  // debug: true,
  client: 'pg',
})

mockKnex.mock(connection)
const tracker = mockKnex.getTracker()
tracker.install()

const genericTaggedString = (strings: TemplateStringsArray, ...values: string[]) => {
  return strings.reduce((combined, string, i) => {
    return combined + string + (i < values.length ? values[i] : '')
  }, "")
};
const SQL = (strings: TemplateStringsArray, ...values: string[]) => genericTaggedString(strings, ...values).replace(/\s+/g, ' ').trim()
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
  tracker.on('query', (query, step) => {
    const queryDefinition = test.executes[step - 1];
    expect(query.sql.replace(/\s+/g, ' ')).equals(queryDefinition.sql)
    query.response(queryDefinition.response)

  })
  expect(await graphql(graphQLSchema, test.query, null, {db: connection})).deep.equal(test.return)
  tracker.uninstall()
}


describe('Queries', () => {

  it('Post with author by id query', async () => {
    await execute({
      query: GQL`
        query {
          Post(where: {id: "${uuid(1)}"}) {
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
					   "Post"."id" AS "id",
					   "author"."id" AS "author__id",
					   "author"."name" AS "author__name"
				   FROM "Post" "Post" LEFT JOIN "Author" "author" ON "Post".author_id = "author".id
				   WHERE "Post"."id" = '${uuid(1)}'`,
          response: [{id: uuid(1), author__id: uuid(2), author__name: "John"}]
        }
      ],
      return: {
        data: {
          Post: {
            id: uuid(1),
            author: {
              id: uuid(2),
              name: "John",
            }
          }
        }
      }
    })
  })

  it('Posts with locales query', async () => {
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
});
