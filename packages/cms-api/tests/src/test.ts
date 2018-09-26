import { expect } from 'chai'
import { graphql } from 'graphql'
import { maskErrors } from 'graphql-errors'
import * as knex from 'knex'
import * as mockKnex from 'mock-knex'
import { testUuid } from './testUuid'
import * as uuid from '../../src/utils/uuid'
import * as sinon from 'sinon'
import { Acl, Model } from 'cms-common'
import GraphQlSchemaBuilderFactory from '../../src/content-api/graphQLSchema/GraphQlSchemaBuilderFactory'
import AllowAllPermissionFactory from '../../src/acl/AllowAllPermissionFactory'
import KnexConnection from '../../src/core/knex/KnexConnection'

export interface SqlQuery {
	sql: string
	parameters?: any[]
	response: any[] | any
}

export interface Test {
	schema: Model.Schema
	permissions?: Acl.Permissions
	variables?: Acl.VariablesMap
	query: string
	executes: SqlQuery[]
	return: object
}

export const sqlTransaction = (executes: SqlQuery[]): SqlQuery[] => {
	return [
		{
			sql: 'BEGIN;',
			response: 1,
		},
		...executes,
		{
			sql: 'COMMIT;',
			response: 1,
		},
	]
}

export const execute = async (test: Test) => {
	const permissions: Acl.Permissions = test.permissions || new AllowAllPermissionFactory().create(test.schema)
	const builder = new GraphQlSchemaBuilderFactory().create(test.schema, permissions)
	const graphQLSchema = builder.build()

	// console.log(printSchema(graphQLSchema))

	maskErrors(graphQLSchema)

	const connection = knex({
		// debug: true,
		client: 'pg',
	})

	mockKnex.mock(connection)

	let id = 1
	const uuidStub = sinon.stub(uuid, 'uuid').callsFake(() => testUuid(id++))

	const tracker = mockKnex.getTracker()
	tracker.install()
	let failed: number | null = null
	tracker.on('query', (query, step) => {
		const queryDefinition = test.executes[step - 1]
		if (query.sql === 'ROLLBACK;') {
			query.response([])
			return
		}
		console.log(query.sql)
		console.log(query.bindings)
		if (!queryDefinition) {
			throw new Error(`Unexpected query #${step} '${query.sql}'`)
		}
		try {
			expect(query.sql.replace(/\s+/g, ' ')).equals(queryDefinition.sql)
			if (queryDefinition.parameters) {
				expect(query.bindings).deep.equals(queryDefinition.parameters)
			}
		} catch (e) {
			failed = step
			throw e
		}
		query.response(queryDefinition.response || [])
	})
	try {
		const response = await graphql(graphQLSchema, test.query, null, {
			db: new KnexConnection(connection),
			identityVariables: test.variables || {},
		})
		// console.log(response)
		expect(response).deep.equal(test.return)
	} finally {
		tracker.uninstall()
		uuidStub.restore()
	}
}
