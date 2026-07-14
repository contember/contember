import { Acl, Input, Model, Schema, Settings, Validation } from '@contember/schema'
import { Authorizator, ExecutionContainerFactory, GraphQlSchemaBuilderFactory, Mapper } from '../../src/index.js'
import { AllowAllPermissionFactory, emptySchema } from '@contember/schema-utils'
import { executeGraphQlTest } from './testGraphql.js'
import { Client, emptyDatabaseMetadata } from '@contember/database'
import { createConnectionMock } from '@contember/database-tester'
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
	allPermissions?: Acl.Permissions
	variables?: Acl.VariablesMap
	query: string
	queryVariables?: Record<string, any>
	executes: SqlQuery[]
	return: object
	setupMapper?: (mapper: Mapper) => void
}

const SQL_BEGIN = {
	sql: 'BEGIN;',
	parameters: [],
	response: {},
}
const SQL_SERIALIZABLE = {
	sql: 'SET TRANSACTION ISOLATION LEVEL SERIALIZABLE',
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

export const relationOnlyUpdateLock = (
	table: string,
	primaryColumn: string,
	primary: Input.PrimaryValue,
	authorized: boolean = true,
): SqlQuery[] => [{
	sql: `select true as "authorized" from "public"."${table}" as "root_" where "root_"."${primaryColumn}" = ? for update of "root_"`,
	parameters: [primary],
	response: { rows: authorized ? [{ authorized: true }] : [] },
}]

export const junctionEndpointLocks = (
	endpoints: readonly { table: string; primaryColumn: string; primary: Input.PrimaryValue }[],
): SqlQuery[] => {
	const groups = new Map<string, { table: string; primaryColumn: string; primaries: Input.PrimaryValue[] }>()
	for (const endpoint of endpoints) {
		const key = `${endpoint.table}\u0000${endpoint.primaryColumn}`
		const group = groups.get(key)
		if (group === undefined) {
			groups.set(key, { table: endpoint.table, primaryColumn: endpoint.primaryColumn, primaries: [endpoint.primary] })
		} else if (!group.primaries.includes(endpoint.primary)) {
			group.primaries.push(endpoint.primary)
		}
	}
	return [...groups]
		.sort(([left], [right]) => left.localeCompare(right))
		.map(([, group]) => {
			const primaries = group.primaries.sort((left, right) => String(left).localeCompare(String(right)))
			return {
				sql: `select "root_"."${group.primaryColumn}" as "primary" from "public"."${group.table}" as "root_" where "root_"."${group.primaryColumn}" in (${
					primaries.map(() => '?').join(', ')
				}) order by "root_"."${group.primaryColumn}" asc for update of "root_"`,
				parameters: primaries,
				response: { rows: primaries.map(primary => ({ primary })) },
			}
		})
}

export const sqlTransaction = (executes: SqlQuery[]): SqlQuery[] => {
	return [
		SQL_BEGIN,
		SQL_SERIALIZABLE,
		...executes,
		{
			sql: 'COMMIT;',
			parameters: [],
			response: {},
		},
	]
}

export const sqlReadTransaction = (executes: SqlQuery[]): SqlQuery[] => {
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
		SQL_SERIALIZABLE,
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
	// Mirror production (GraphQlSchemaFactory): the GraphQL schema is built from the through-inclusive `all` set,
	// so fields granted only through a relation are still exposed.
	const authorizator = new Authorizator(test.allPermissions ?? permissions, false, false, permissions)
	const builder = new GraphQlSchemaBuilderFactory().create(test.schema, authorizator)
	const graphQLSchema = builder.build()

	const connection = createConnectionMock(test.executes)

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
				test.setupMapper?.(mapper)
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
					allPermissions: test.allPermissions,
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
