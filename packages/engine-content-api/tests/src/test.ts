import { Acl, Model, Schema, Validation } from '@contember/schema'
import { ExecutionContainerFactory, GraphQlSchemaBuilderFactory, Authorizator } from '../../src'
import { AllowAllPermissionFactory, emptySchema } from '@contember/schema-utils'
import { executeGraphQlTest } from './testGraphql'
import { Client } from '@contember/database'
import { createConnectionMock } from '@contember/database-tester'
import { createUuidGenerator } from '@contember/engine-api-tester'
import { getArgumentValues } from 'graphql/execution/values'
import { SQL } from './tags'

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
	const authorizator = new Authorizator(permissions, false)
	const builder = new GraphQlSchemaBuilderFactory().create(test.schema, authorizator)
	const graphQLSchema = builder.build()

	const connection = createConnectionMock(test.executes)

	const db = new Client(connection, 'public', {})
	const schema: Schema = { ...emptySchema, model: test.schema, validation: test.validation || {} }
	await executeGraphQlTest({
		context: {
			db: db,
			identityVariables: test.variables || {},
			executionContainer: new ExecutionContainerFactory(
				schema,
				permissions,
				{
					uuid: createUuidGenerator(),
					now: () => new Date('2019-09-04 12:00'),
				},
				getArgumentValues,
				() => Promise.resolve(),
			).create({
				db,
				identityVariables: test.variables || {},
			}),
			timer: (label: any, cb: any) => cb(),
		},
		query: test.query,
		queryVariables: test.queryVariables,
		return: test.return,
		schema: graphQLSchema,
	})
}
