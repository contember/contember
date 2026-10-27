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

test('role combinations with identical permissions share one schema', async () => {
	const factory = createFactory()

	expect(await create(factory, ['editor'])).toBe(await create(factory, ['admin']))
})

test('a role without content permissions does not split the cache', async () => {
	const factory = createFactory()

	expect(await create(factory, ['admin', 'newsletter'])).toBe(await create(factory, ['admin']))
})

test('role combinations with different permissions get their own schema', async () => {
	const factory = createFactory()
	const admin = await create(factory, ['admin'])
	const reader = await create(factory, ['reader'])

	expect(reader).not.toBe(admin)
	expect(mutationFields(admin).createArticle).toBeDefined()
	expect(mutationFields(reader).createArticle).toBeUndefined()
})

test('a contributor cache key separates role combinations with identical permissions', async () => {
	const factory = createFactory([{
		getCacheKey: ({ identity }) => identity.projectRoles.includes('editor') ? 'editor' : 'other',
		createSchema: () => undefined,
	}])

	expect(await create(factory, ['editor'])).not.toBe(await create(factory, ['admin']))
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

const hasRefreshMutation = async (factory: GraphQlSchemaFactory, projectRoles: string[]) =>
	mutationFields(await factory.create(materializedViewSchema, { projectRoles }, project)).refreshMaterializedView !== undefined

test('a role without the refresh permission cannot refresh a materialized view another role may refresh', async () => {
	const factory = createFactory()

	expect(await hasRefreshMutation(factory, ['reader'])).toBe(false)
	expect(await hasRefreshMutation(factory, ['refresher'])).toBe(true)
	expect(await hasRefreshMutation(factory, ['reader'])).toBe(false)
})

test('the refresh permission is inherited', async () => {
	expect(await hasRefreshMutation(createFactory(), ['inheritedRefresher'])).toBe(true)
})

test('a Json column accepts an object literal next to the introspection schema', async () => {
	const { schema: result } = await create(createFactory(), ['admin'])
	const document = parse('mutation { createArticle(data: { data: { message: "hello", tags: ["a"] } }) { ok } }')
	expect(validate(result.schema, document, { scalars: result.scalars }).map(it => it.message)).toEqual([])
})

test('role schemas of one project schema share the types their permissions do not change', async () => {
	const factory = createFactory()
	const jsonSchema = async (roles: string[]) => (await create(factory, roles)).schema.schema
	const admin = await jsonSchema(['admin'])
	const reader = await jsonSchema(['reader'])

	expect(reader.t.Article).toBe(admin.t.Article)
	expect(reader.t.ArticleWhere).toBe(admin.t.ArticleWhere)
	expect(reader.t.Query).not.toBe(admin.t.Query)
	expect(reader.m).toBeNull()
})

const collectGarbage = async () => {
	// a WeakRef target stays alive until the current job ends
	await new Promise(resolve => setTimeout(resolve, 0))
	Bun.gc(true)
	await new Promise(resolve => setTimeout(resolve, 0))
}

/** The collector scans the stack conservatively, so a single pass may keep a dead object; retry a few times. */
const isCollected = async (ref: WeakRef<object>): Promise<boolean> => {
	for (let attempt = 0; attempt < 10 && ref.deref() !== undefined; attempt++) {
		await new Promise(resolve => setTimeout(resolve, 20))
		await collectGarbage()
	}
	return ref.deref() === undefined
}

const manyRolesSchema: Schema = {
	...emptySchema,
	model: {
		entities: Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`Article${i}`, { ...article, name: `Article${i}`, tableName: `article${i}` }])),
		enums: {},
	},
	acl: {
		roles: Object.fromEntries(
			Array.from({ length: 20 }, (_, i) => [`role${i}`, role({ [`Article${i}`]: { predicates: {}, operations: { read: allFields } } })]),
		),
	},
}

/** Keeps one interned type and only a weak reference to the cached schema, so the cache alone decides its lifetime. */
const buildAndForget = async (factory: GraphQlSchemaFactory, schema: Schema, role: string, typeName: string) => {
	const { schema: built } = await factory.create(schema, { projectRoles: [role] }, project)
	return { built: new WeakRef(built), type: built.schema.t[typeName] }
}

test('once every schema of a project schema is evicted, the data they shared is not retained', async () => {
	const factory = new GraphQlSchemaFactory(
		new ContentApiSpecificCache<Schema, GraphQLSchemaFactoryResult>({ ttlSeconds: 0.01 }),
		new PermissionFactory(),
		[],
	)
	const evicted = await buildAndForget(factory, schema, 'admin', 'Article')
	await new Promise(resolve => setTimeout(resolve, 50))
	expect(await isCollected(evicted.built)).toBe(true)

	// the interner of the evicted schema is gone, so the rebuilt schema does not reuse its types
	expect((await factory.create(schema, { projectRoles: ['admin'] }, project)).schema.schema.t.Article).not.toBe(evicted.type)
})

test('once most schemas of a generation are evicted, new schemas no longer share its interned data', async () => {
	const factory = new GraphQlSchemaFactory(
		new ContentApiSpecificCache<Schema, GraphQLSchemaFactoryResult>({ maxEntries: 1 }),
		new PermissionFactory(),
		[],
	)
	const first = await buildAndForget(factory, manyRolesSchema, 'role0', 'Article0')
	await buildAndForget(factory, manyRolesSchema, 'role1', 'Article1')
	expect(await isCollected(first.built)).toBe(true)
	// 16 evictions start a new generation; the extra roles leave room for a schema the collector keeps for a while
	for (let i = 2; i < 20; i++) {
		await buildAndForget(factory, manyRolesSchema, `role${i}`, `Article${i}`)
		await collectGarbage()
	}

	expect((await factory.create(manyRolesSchema, { projectRoles: ['role0'] }, project)).schema.schema.t.Article0).not.toBe(first.type)
})

test('concurrent requests of one role combination build it once', async () => {
	const factory = createFactory()
	const [editor, admin] = await Promise.all([create(factory, ['editor']), create(factory, ['admin'])])

	expect(editor).toBe(admin)
})

test('a failed build is not cached', async () => {
	let fail = true
	const factory = createFactory([{
		createSchema: () => {
			if (fail) {
				throw new Error('contributor failed')
			}
			return undefined
		},
	}])

	await expect(create(factory, ['admin'])).rejects.toThrow('contributor failed')
	fail = false
	expect(mutationFields(await create(factory, ['admin'])).createArticle).toBeDefined()
})

const chainedEntities = (count: number): Model.Schema['entities'] =>
	Object.fromEntries(Array.from({ length: count }, (_, i): [string, Model.Entity] => [`Node${i}`, {
		...article,
		name: `Node${i}`,
		tableName: `node${i}`,
		fields: {
			...article.fields,
			next: {
				name: 'next',
				type: Model.RelationType.ManyHasOne,
				target: `Node${(i + 1) % count}`,
				joiningColumn: { columnName: 'next_id', onDelete: Model.OnDelete.restrict },
				nullable: true,
			},
		},
	}]))

test('a large schema is built in slices, between which the event loop runs I/O callbacks', async () => {
	const entities = chainedEntities(150)
	const allOperations = {
		read: { ...allFields, next: true },
		create: { ...allFields, next: true },
		update: { ...allFields, next: true },
		delete: true,
	}
	const largeSchema: Schema = {
		...emptySchema,
		model: { entities, enums: {} },
		acl: { roles: { admin: role(Object.fromEntries(Object.keys(entities).map(name => [name, { predicates: {}, operations: allOperations }]))) } },
	}
	const events: string[] = []
	setImmediate(() => events.push('io'))
	await createFactory().create(largeSchema, { projectRoles: ['admin'] }, project)
	events.push('built')

	expect(events).toEqual(['io', 'built'])
})
