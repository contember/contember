import * as knex from 'knex'
import { Acl, Model } from 'cms-common'
import GraphQlSchemaBuilderFactory from '../../src/content-api/graphQLSchema/GraphQlSchemaBuilderFactory'
import AllowAllPermissionFactory from '../../src/acl/AllowAllPermissionFactory'
import S3 from '../../src/utils/S3'
import { executeGraphQlTest } from './testGraphql'
import KnexWrapper from '../../src/core/knex/KnexWrapper'

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

	const connection = knex({
		// debug: true,
		client: 'pg',
	})

	await executeGraphQlTest(connection, {
		context: {
			db: new KnexWrapper(connection, 'public'),
			identityVariables: test.variables || {},
			identityId: '11111111-1111-1111-1111-111111111111',
		},
		executes: test.executes,
		query: test.query,
		return: test.return,
		schema: graphQLSchema,
	})
}
