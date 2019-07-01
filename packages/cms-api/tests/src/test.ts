import { Acl, Model } from 'cms-common'
import GraphQlSchemaBuilderFactory from '../../src/content-api/graphQLSchema/GraphQlSchemaBuilderFactory'
import AllowAllPermissionFactory from '../../src/acl/AllowAllPermissionFactory'
import S3 from '../../src/utils/S3'
import { executeGraphQlTest } from './testGraphql'
import Client from '../../src/core/database/Client'
import ExecutionContainerFactory from '../../src/content-api/graphQlResolver/ExecutionContainerFactory'
import { createConnectionMock } from './ConnectionMock'

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
	queryVariables?: Record<string, any>
	executes: SqlQuery[]
	return: object
}

export const sqlTransaction = (executes: SqlQuery[]): SqlQuery[] => {
	return executes
}

export const execute = async (test: Test) => {
	const permissions: Acl.Permissions = test.permissions || new AllowAllPermissionFactory().create(test.schema)
	const builder = new GraphQlSchemaBuilderFactory(
		new S3({
			bucket: '',
			prefix: '',
			region: '',
			credentials: {
				key: '',
				secret: '',
			},
		})
	).create(test.schema, permissions)
	const graphQLSchema = builder.build()

	const connection = createConnectionMock(test.executes)

	// @ts-ignore
	const db = new Client(connection, 'public')
	await executeGraphQlTest({
		context: {
			db: db,
			identityVariables: test.variables || {},
			executionContainer: new ExecutionContainerFactory(test.schema, permissions).create({
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
