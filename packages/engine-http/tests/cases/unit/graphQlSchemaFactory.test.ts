import { expect, test } from 'bun:test'
import { parse } from 'graphql'
import { TypeKind, validate } from '@contember/graphql-json'
import { PermissionFactory } from '@contember/engine-content-api'
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
		data: { name: 'data', columnName: 'data', type: Model.ColumnType.Json, columnType: 'jsonb', nullable: true },
	},
}

const allFields: Acl.FieldPermissions = { id: true, title: true, data: true }

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
	new GraphQlSchemaFactory(new ContentApiSpecificCache<Schema, GraphQLSchemaFactoryResult>({}), new PermissionFactory(), contributors)

const create = (factory: GraphQlSchemaFactory, projectRoles: string[]) => factory.create(schema, { projectRoles }, project)

const mutationFields = ({ schema }: GraphQLSchemaFactoryResult): Record<string, unknown> => {
	const mutation = schema.schema.m ? schema.schema.t[schema.schema.m] : undefined
	return mutation?.[0] === TypeKind.OBJECT ? mutation[1] : {}
}

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
	expect(mutationFields(admin).createArticle).toBeDefined()
	expect(mutationFields(reader).createArticle).toBeUndefined()
})

test('a contributor cache key separates role combinations with identical permissions', () => {
	const factory = createFactory([{
		getCacheKey: ({ identity }) => identity.projectRoles.includes('editor') ? 'editor' : 'other',
		createSchema: () => undefined,
	}])

	expect(create(factory, ['editor'])).not.toBe(create(factory, ['admin']))
})

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
	mutationFields(factory.create(materializedViewSchema, { projectRoles }, project)).refreshMaterializedView !== undefined

test('a role without the refresh permission cannot refresh a materialized view another role may refresh', () => {
	const factory = createFactory()

	expect(hasRefreshMutation(factory, ['reader'])).toBe(false)
	expect(hasRefreshMutation(factory, ['refresher'])).toBe(true)
	expect(hasRefreshMutation(factory, ['reader'])).toBe(false)
})

test('the refresh permission is inherited', () => {
	expect(hasRefreshMutation(createFactory(), ['inheritedRefresher'])).toBe(true)
})

test('a Json column accepts an object literal next to the introspection schema', () => {
	const { schema: result } = create(createFactory(), ['admin'])
	const document = parse('mutation { createArticle(data: { data: { message: "hello", tags: ["a"] } }) { ok } }')
	expect(validate(result.schema, document, { scalars: result.scalars }).map(it => it.message)).toEqual([])
})

test('role schemas of one project schema share the types their permissions do not change', () => {
	const factory = createFactory()
	const jsonSchema = (roles: string[]) => create(factory, roles).schema.schema
	const admin = jsonSchema(['admin'])
	const reader = jsonSchema(['reader'])

	expect(reader.t.Article).toBe(admin.t.Article)
	expect(reader.t.ArticleWhere).toBe(admin.t.ArticleWhere)
	expect(reader.t.Query).not.toBe(admin.t.Query)
	expect(reader.m).toBeNull()
})
