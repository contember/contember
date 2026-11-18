import { Acl, Model, Schema, Settings, Validation } from '@contember/schema'
import { Authorizator, ExecutionContainerFactory, GraphQlSchemaBuilderFactory, JsonContentSchemaBuilder } from '../../src/index.js'
import { AllowAllPermissionFactory, emptySchema } from '@contember/schema-utils'
import { assertGraphQlTestResult, GraphQlTestSchema, normalizeGraphQlResult, runGraphQlTest, serializeGraphQlResult } from './testGraphql.js'
import { Client, emptyDatabaseMetadata, RequestMemoryBudget, RequestMemoryBudgetOptions } from '@contember/database'
import { createConnectionMock } from '@contember/database-tester'
import { expect } from 'bun:test'
import { createUuidGenerator, testUuid } from './testUuid.js'

export interface SqlQuery {
	sql: string
	parameters?: any[]
	response: any[] | any
}

export interface Test {
	schema: Model.Schema
	settings?: Settings.Schema
	validation?: Validation.Schema
	permissions?: Acl.Permissions
	/** Permission set effective under a relation (root grants plus `through` ones). Defaults to `permissions`. */
	nestedPermissions?: Acl.Permissions
	variables?: Acl.VariablesMap
	query: string
	queryVariables?: Record<string, any>
	/** Each engine run gets its own budget: an exceeded budget stays exceeded. */
	memoryBudget?: RequestMemoryBudgetOptions
	executes: SqlQuery[]
	/** The graphql-json response; also the graphql-js one unless `graphqlJsReturn` is set. */
	return: object
	/** A known difference: graphql-js answers this instead (errors reduced to their messages). */
	graphqlJsReturn?: object
}

const SQL_BEGIN = {
	sql: 'BEGIN;',
	parameters: [],
	response: {},
}
const SQL_REPEATABLE_READ = {
	sql: 'SET TRANSACTION ISOLATION LEVEL REPEATABLE READ',
	parameters: [],
	response: {},
}

export const systemVariableQueries: SqlQuery[] = [
	{
		sql: 'select set_config(?, ?, false)',
		parameters: ['tenant.identity_id', '00000000-0000-0000-0000-000000000000'],
		response: {},
	},
	{
		sql: 'select set_config(?, ?, false)',
		parameters: ['system.transaction_id', testUuid(1)],
		response: {},
	},
]

export const sqlTransaction = (executes: SqlQuery[]): SqlQuery[] => {
	return [
		SQL_BEGIN,
		SQL_REPEATABLE_READ,
		...executes,
		{
			sql: 'COMMIT;',
			parameters: [],
			response: {},
		},
	]
}

export const failedTransaction = (executes: SqlQuery[]): SqlQuery[] => {
	return [
		SQL_BEGIN,
		SQL_REPEATABLE_READ,
		...executes,
		{
			sql: 'ROLLBACK;',
			parameters: [],
			response: {},
		},
	]
}

/**
 * Runs the request on graphql-js, as clients get it by default, and on graphql-json. Both must answer with the same bytes
 * (key order and errors included) and leave the same expected queries unused; then the answer is checked against `return`.
 */
export const execute = async (test: Test) => {
	const permissions: Acl.Permissions = test.permissions || new AllowAllPermissionFactory().create(test.schema)
	// Mirror production (GraphQlSchemaFactory): types are shaped by the nested set, root fields by the root set.
	const nestedPermissions: Acl.Permissions = test.nestedPermissions ?? permissions
	const authorizator = new Authorizator(nestedPermissions, false, false)
	const rootAuthorizator = new Authorizator(permissions, false, false)

	const graphqlJs = await executeOnEngine(test, permissions, nestedPermissions, {
		engine: 'graphql-js',
		schema: new GraphQlSchemaBuilderFactory().create(test.schema, authorizator, rootAuthorizator).build(),
	})
	const graphqlJson = await executeOnEngine(test, permissions, nestedPermissions, {
		engine: 'graphql-json',
		schema: new JsonContentSchemaBuilder(test.schema, authorizator, rootAuthorizator).build(),
	})
	if (test.graphqlJsReturn) {
		expect(normalizeGraphQlResult(graphqlJs.result)).toStrictEqual(test.graphqlJsReturn)
		assertGraphQlTestResult(graphqlJson.result, test.return)
		return
	}
	expect(graphqlJson.serialized).toBe(graphqlJs.serialized)
	expect(graphqlJson.unusedQueries).toBe(graphqlJs.unusedQueries)

	assertGraphQlTestResult(graphqlJs.result, test.return)
}

const executeOnEngine = async (
	test: Test,
	permissions: Acl.Permissions,
	nestedPermissions: Acl.Permissions,
	graphQLSchema: GraphQlTestSchema,
) => {
	// the mock consumes the list, and a run must not see rows the other run's hydration touched
	const expectedQueries = test.executes.map(it => ({ ...it, response: structuredClone(it.response) }))
	const connection = createConnectionMock(expectedQueries)

	const db = new Client(connection, 'public', {})
	const schema: Schema = { ...emptySchema, model: test.schema, validation: test.validation || {}, settings: test.settings || emptySchema.settings }
	const providers = {
		uuid: createUuidGenerator('a456', 0),
		now: () => new Date('2019-09-04 12:00'),
	}
	const executionContainerFactory = new ExecutionContainerFactory(providers)
	executionContainerFactory.hooks.push(it => {
		return it.setupService('mapperFactory', mapperFactory => {
			mapperFactory.hooks.push(mapper => {
				;(mapper as any).systemVariablesSetupDone = Promise.resolve(true)
			})
		})
	})
	const result = await runGraphQlTest({
		context: {
			db: db,
			identityVariables: test.variables || {},
			executionContainer: executionContainerFactory
				.create({
					permissions,
					allPermissions: nestedPermissions,
					schema,
					schemaMeta: {
						id: 1,
					},
					db,
					memoryBudget: test.memoryBudget ? new RequestMemoryBudget(test.memoryBudget) : undefined,
					identityVariables: test.variables || {},
					identityId: '00000000-0000-0000-0000-000000000000',
					systemSchema: 'system',
					stage: { id: '00000000-0000-0000-0000-000000000000', slug: 'live' },
					project: { slug: 'test' },
					schemaDatabaseMetadata: emptyDatabaseMetadata,
					userInfo: { ipAddress: null, userAgent: null },
				}),
			timer: (label: any, cb: any) => cb(),
		},
		query: test.query,
		queryVariables: test.queryVariables,
		schema: graphQLSchema,
	})
	return { result, serialized: serializeGraphQlResult(result), unusedQueries: expectedQueries.length }
}
