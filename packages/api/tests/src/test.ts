import { expect } from "chai"
import { graphql } from "graphql"
import { maskErrors } from "graphql-errors"
import * as knex from "knex"
import * as mockKnex from "mock-knex"
import GraphQlSchemaBuilder from "../../src/graphQLSchema/GraphQlSchemaBuilder"
import model from "../model"
import { testUuid } from "./testUuid";
import * as uuid from "../../src/utils/uuid";
import * as sinon from 'sinon';
import { Schema } from "../../src/schema/model";



export interface SqlQuery
{
  sql: string
  parameters?: any[]
  response?: any[]
}

export interface Test
{
  schema?: Schema
  query: string
  executes: SqlQuery[]
  return: object
}

export const execute = async (test: Test) => {
  const builder = new GraphQlSchemaBuilder(test.schema || model)
  const graphQLSchema = builder.build()

  maskErrors(graphQLSchema)

  const connection = knex({
    // debug: true,
    client: "pg",
  })

  mockKnex.mock(connection)

  let id = 1
  const uuidStub = sinon.stub(uuid, 'uuid').callsFake(() => testUuid(id++))

  const tracker = mockKnex.getTracker()
  tracker.install()
  let failed: number | null = null
  tracker.on("query", (query, step) => {
    const queryDefinition = test.executes[step - 1]
    if (failed === step -1 && query.sql === 'ROLLBACK;') {
      query.response([])
      return
    }
    // console.log(query.sql)
    // console.log(query.bindings)
    if (!queryDefinition) {
      throw new Error(`Unexpected query #${step} '${query.sql}'`)
    }
    try {
      expect(query.sql.replace(/\s+/g, " ")).equals(queryDefinition.sql)
      if (queryDefinition.parameters) {
        expect(query.bindings).deep.equals(queryDefinition.parameters)
      }
    } catch(e) {
      failed = step
      throw e
    }
    query.response(queryDefinition.response || [])

  })
  const response = await graphql(graphQLSchema, test.query, null, {db: connection});
  // console.log(response)
  expect(response).deep.equal(test.return)
  tracker.uninstall()

  uuidStub.restore()
}
