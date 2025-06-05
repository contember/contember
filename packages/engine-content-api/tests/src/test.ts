import { Acl, Model, Schema, Validation } from '@contember/schema'
import { Authorizator, GraphQlSchemaBuilderFactory, ExecutionContainerFactory } from '../../src'
import { AllowAllPermissionFactory, emptySchema } from '@contember/schema-utils'
import { executeGraphQlTest } from './testGraphql'
import { Client, emptyDatabaseMetadata } from '@contember/database'
import { createConnectionMock } from '@contember/database-tester'
import { createUuidGenerator, testUuid } from './testUuid'

export interface SqlQuery {
	sql: string
	parameters?: any[]
	response: any[] | any
}

export interface Test {
	schema: Model.Schema
	validation?: Validation.Schema
	permissions?: Acl.Permissions
	variables?: Acl.VariablesMap
	query: string
	queryVariables?: Record<string, any>
	executes: SqlQuery[]
	return: object
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

export const execute = async (test: Test) => {
	const permissions: Acl.Permissions = test.permissions || new AllowAllPermissionFactory().create(test.schema)
	const authorizator = new Authorizator(permissions, false, false)
	const builder = new GraphQlSchemaBuilderFactory().create(test.schema, authorizator)
	const graphQLSchema = builder.build()

	const connection = createConnectionMock(test.executes)

	const db = new Client(connection, 'public', {})
	const schema: Schema = { ...emptySchema, model: test.schema, validation: test.validation || {} }
	const providers = {
		uuid: createUuidGenerator('a456', 0),
		now: () => new Date('2019-09-04 12:00'),
	}
	const executionContainerFactory = new ExecutionContainerFactory(providers)
	executionContainerFactory.hooks.push(it => {
		return it.setupService('mapperFactory', mapperFactory => {
			mapperFactory.hooks.push(mapper => {
				(mapper as any).systemVariablesSetupDone = Promise.resolve(true)
			})
		})
	})
	await executeGraphQlTest({
		context: {
			db: db,
			identityVariables: test.variables || {},
			executionContainer: executionContainerFactory
				.create({
					permissions,
					schema,
					schemaMeta: {
						id: 1,
					},
					db,
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
		return: test.return,
		schema: graphQLSchema,
	})
}
