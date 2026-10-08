import { expect, test } from 'bun:test'
import { GraphQlSchemaBuilderFactory, PermissionFactory } from '@contember/engine-content-api'
import { Acl, Model, Schema } from '@contember/schema'
import { emptySchema } from '@contember/schema-utils'
import { ContentApiSpecificCache } from '../../../src/content/ContentApiSpecificCache.js'
import { GraphQlSchemaFactory, GraphQLSchemaFactoryResult } from '../../../src/content/GraphQlSchemaFactory.js'
import { GraphQLSchemaContributor } from '../../../src/content/GraphQLSchemaContributor.js'
import { ProjectConfig } from '../../../src/project/config.js'

const article: Model.Entity = {
	name: 'Article',
	primary: 'id',
	primaryColumn: 'id',
	tableName: 'article',
	unique: [],
	indexes: [],
	eventLog: { enabled: true },
	fields: {
		id: { name: 'id', columnName: 'id', type: Model.ColumnType.Uuid, columnType: 'uuid', nullable: false },
		title: { name: 'title', columnName: 'title', type: Model.ColumnType.String, columnType: 'text', nullable: true },
	},
}

const allFields: Acl.FieldPermissions = { id: true, title: true }

const role = (entities: Acl.Permissions): Acl.RolePermissions => ({ variables: {}, entities })

const schema: Schema = {
	...emptySchema,
	model: { entities: { Article: article }, enums: {} },
	acl: {
		roles: {
			admin: role({ Article: { predicates: {}, operations: { read: allFields, create: allFields, update: allFields, delete: true } } }),
			editor: role({ Article: { predicates: {}, operations: { read: allFields, create: allFields, update: allFields, delete: true } } }),
			reader: role({ Article: { predicates: {}, operations: { read: allFields } } }),
			newsletter: role({}),
		},
	},
}

const project: ProjectConfig = {
	slug: 'test',
	name: 'test',
	stages: [{ slug: 'live', name: 'live' }],
	db: { host: 'localhost', port: 5432, user: 'test', password: 'test', database: 'test' },
}

const createFactory = (contributors: GraphQLSchemaContributor[] = []) =>
	new GraphQlSchemaFactory(
		new ContentApiSpecificCache<Schema, GraphQLSchemaFactoryResult>({}),
		new GraphQlSchemaBuilderFactory(),
		new PermissionFactory(),
		contributors,
	)

const create = (factory: GraphQlSchemaFactory, projectRoles: string[]) => factory.create(schema, { projectRoles }, project)

test('role combinations with identical permissions share one schema', () => {
	const factory = createFactory()

	expect(create(factory, ['editor'])).toBe(create(factory, ['admin']))
})

test('a role without content permissions does not split the cache', () => {
	const factory = createFactory()

	expect(create(factory, ['admin', 'newsletter'])).toBe(create(factory, ['admin']))
})

test('role combinations with different permissions get their own schema', () => {
	const factory = createFactory()
	const admin = create(factory, ['admin'])
	const reader = create(factory, ['reader'])

	expect(reader).not.toBe(admin)
	expect(admin.schema.getMutationType()?.getFields().createArticle).toBeDefined()
	expect(reader.schema.getMutationType()?.getFields().createArticle).toBeUndefined()
})

test('a contributor cache key separates role combinations with identical permissions', () => {
	const factory = createFactory([{
		getCacheKey: ({ identity }) => identity.projectRoles.includes('editor') ? 'editor' : 'other',
		createSchema: () => undefined,
	}])

	expect(create(factory, ['editor'])).not.toBe(create(factory, ['admin']))
})
