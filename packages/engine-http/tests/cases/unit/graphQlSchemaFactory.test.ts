import { expect, test } from 'bun:test'
import { GraphQlSchemaBuilderFactory, PermissionFactory } from '@contember/engine-content-api'
import { Acl, Model, Schema } from '@contember/schema'
import { emptySchema } from '@contember/schema-utils'
import { ContentApiSpecificCache } from '../../../src/content/ContentApiSpecificCache'
import { GraphQlSchemaFactory, GraphQLSchemaFactoryResult } from '../../../src/content/GraphQlSchemaFactory'
import { ProjectConfig } from '../../../src/project/config'

const role = (entities: Acl.Permissions): Acl.RolePermissions => ({ variables: {}, entities })

const project: ProjectConfig = {
	slug: 'test',
	name: 'test',
	stages: [{ slug: 'live', name: 'live' }],
	db: { host: 'localhost', port: 5432, user: 'test', password: 'test', database: 'test' },
}

const createFactory = () =>
	new GraphQlSchemaFactory(
		new ContentApiSpecificCache<Schema, GraphQLSchemaFactoryResult>({}),
		new GraphQlSchemaBuilderFactory(),
		new PermissionFactory(),
		[],
	)

const stats: Model.Entity = {
	name: 'Stats',
	primary: 'id',
	primaryColumn: 'id',
	tableName: 'stats',
	unique: [],
	indexes: [],
	eventLog: { enabled: false },
	view: { sql: 'SELECT 1', materialized: true },
	fields: {
		id: { name: 'id', columnName: 'id', type: Model.ColumnType.Uuid, columnType: 'uuid', nullable: false },
	},
}

const readStats: Acl.Permissions = { Stats: { predicates: {}, operations: { read: { id: true } } } }

const materializedViewSchema: Schema = {
	...emptySchema,
	model: { entities: { Stats: stats }, enums: {} },
	acl: {
		roles: {
			reader: role(readStats),
			refresher: { ...role(readStats), content: { refreshMaterializedView: true } },
			inheritedRefresher: { ...role(readStats), inherits: ['refresher'] },
		},
	},
}

const hasRefreshMutation = (factory: GraphQlSchemaFactory, projectRoles: string[]) =>
	factory.create(materializedViewSchema, { projectRoles }, project).schema.getMutationType()?.getFields().refreshMaterializedView !== undefined

test('a role without the refresh permission cannot refresh a materialized view another role may refresh', () => {
	const factory = createFactory()

	expect(hasRefreshMutation(factory, ['reader'])).toBe(false)
	expect(hasRefreshMutation(factory, ['refresher'])).toBe(true)
	expect(hasRefreshMutation(factory, ['reader'])).toBe(false)
})

test('the refresh permission is inherited', () => {
	expect(hasRefreshMutation(createFactory(), ['inheritedRefresher'])).toBe(true)
})
