import { describe, expect, test } from 'bun:test'
import { parse } from 'graphql'
import { TypeKind, validate } from '@contember/graphql-json'
import { GraphQlSchemaBuilderFactory, JsonContentSchema, PermissionFactory } from '@contember/engine-content-api'
import { Acl, Model, Schema } from '@contember/schema'
import { emptySchema } from '@contember/schema-utils'
import { ContentApiSpecificCache } from '../../../src/content/ContentApiSpecificCache.js'
import { ContentGraphQLEngine, ContentGraphQLEngineResolver } from '../../../src/content/ContentGraphQLEngine.js'
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

const createFactory = (
	contributors: GraphQLSchemaContributor[] = [],
	engineResolver = new ContentGraphQLEngineResolver('graphql-json'),
	cache = new ContentApiSpecificCache<Schema, GraphQLSchemaFactoryResult>({}),
) => new GraphQlSchemaFactory(cache, new GraphQlSchemaBuilderFactory(), new PermissionFactory(), contributors, engineResolver)

const create = (factory: GraphQlSchemaFactory, projectRoles: string[], forProject = project) => factory.create(schema, { projectRoles }, forProject)

const mutationFields = ({ schema }: GraphQLSchemaFactoryResult): Record<string, unknown> => {
	if (schema.engine === 'graphql-js') {
		return schema.schema.getMutationType()?.getFields() ?? {}
	}
	const json = schema.schema.schema
	const mutation = json.m ? json.t[json.m] : undefined
	return mutation?.[0] === TypeKind.OBJECT ? mutation[1] : {}
}

const jsonSchemaOf = ({ schema }: GraphQLSchemaFactoryResult): JsonContentSchema => {
	if (schema.engine !== 'graphql-json') {
		throw new Error(`expected a graphql-json schema, got ${schema.engine}`)
	}
	return schema.schema
}

test('the content API runs on graphql-js unless configured otherwise', async () => {
	const factory = new GraphQlSchemaFactory(
		new ContentApiSpecificCache<Schema, GraphQLSchemaFactoryResult>({}),
		new GraphQlSchemaBuilderFactory(),
		new PermissionFactory(),
		[],
	)

	expect((await create(factory, ['admin'])).schema.engine).toBe('graphql-js')
})

// Both projects share the content schema and the roles, so this also checks that the engine is part of the cache key.
test('a listed project runs on graphql-json, the other projects on the default engine', async () => {
	const factory = createFactory([], new ContentGraphQLEngineResolver('graphql-js', ['switched']))
	const switched = await create(factory, ['admin'], { ...project, slug: 'switched' })
	const other = await create(factory, ['admin'])

	expect(switched.schema.engine).toBe('graphql-json')
	expect(other.schema.engine).toBe('graphql-js')
	expect(mutationFields(switched).createArticle).toBeDefined()
	expect(mutationFields(other).createArticle).toBeDefined()
})

test('the default engine applies to every project that is not listed', async () => {
	const factory = createFactory([], new ContentGraphQLEngineResolver('graphql-json', ['switched']))

	expect((await create(factory, ['admin'])).schema.engine).toBe('graphql-json')
	expect((await create(factory, ['admin'], { ...project, slug: 'switched' })).schema.engine).toBe('graphql-json')
})

const engines: ContentGraphQLEngine[] = ['graphql-js', 'graphql-json']

describe.each(engines)('on %s', engine => {
	const createEngineFactory = (contributors: GraphQLSchemaContributor[] = []) => createFactory(contributors, new ContentGraphQLEngineResolver(engine))

	test('role combinations with identical permissions share one schema', async () => {
		const factory = createEngineFactory()

		expect(await create(factory, ['editor'])).toBe(await create(factory, ['admin']))
	})

	test('a role without content permissions does not split the cache', async () => {
		const factory = createEngineFactory()

		expect(await create(factory, ['admin', 'newsletter'])).toBe(await create(factory, ['admin']))
	})

	test('role combinations with different permissions get their own schema', async () => {
		const factory = createEngineFactory()
		const admin = await create(factory, ['admin'])
		const reader = await create(factory, ['reader'])

		expect(reader).not.toBe(admin)
		expect(mutationFields(admin).createArticle).toBeDefined()
		expect(mutationFields(reader).createArticle).toBeUndefined()
	})

	test('a contributor cache key separates role combinations with identical permissions', async () => {
		const factory = createEngineFactory([{
			getCacheKey: ({ identity }) => identity.projectRoles.includes('editor') ? 'editor' : 'other',
			createSchema: () => undefined,
		}])

		expect(await create(factory, ['editor'])).not.toBe(await create(factory, ['admin']))
	})

	test('a role without the refresh permission cannot refresh a materialized view another role may refresh', async () => {
		const factory = createEngineFactory()

		expect(await hasRefreshMutation(factory, ['reader'])).toBe(false)
		expect(await hasRefreshMutation(factory, ['refresher'])).toBe(true)
		expect(await hasRefreshMutation(factory, ['reader'])).toBe(false)
	})

	test('the refresh permission is inherited', async () => {
		expect(await hasRefreshMutation(createEngineFactory(), ['inheritedRefresher'])).toBe(true)
	})

	test('concurrent requests of one role combination build it once', async () => {
		const factory = createEngineFactory()
		const [editor, admin] = await Promise.all([create(factory, ['editor']), create(factory, ['admin'])])

		expect(editor).toBe(admin)
	})

	test('a failed build is not cached', async () => {
		let fail = true
		const factory = createEngineFactory([{
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

test('a Json column accepts an object literal next to the introspection schema', async () => {
	const result = jsonSchemaOf(await create(createFactory(), ['admin']))
	const document = parse('mutation { createArticle(data: { data: { message: "hello", tags: ["a"] } }) { ok } }')
	expect(validate(result.schema, document, { scalars: result.scalars }).map(it => it.message)).toEqual([])
})

test('role schemas of one project schema share the types their permissions do not change', async () => {
	const factory = createFactory()
	const jsonSchema = async (roles: string[]) => jsonSchemaOf(await create(factory, roles)).schema
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
	const built = jsonSchemaOf(await factory.create(schema, { projectRoles: [role] }, project))
	return { built: new WeakRef(built), type: built.schema.t[typeName] }
}

test('once every schema of a project schema is evicted, the data they shared is not retained', async () => {
	const factory = createFactory([], undefined, new ContentApiSpecificCache<Schema, GraphQLSchemaFactoryResult>({ ttlSeconds: 0.01 }))
	const evicted = await buildAndForget(factory, schema, 'admin', 'Article')
	await new Promise(resolve => setTimeout(resolve, 50))
	expect(await isCollected(evicted.built)).toBe(true)

	// the interner of the evicted schema is gone, so the rebuilt schema does not reuse its types
	expect(jsonSchemaOf(await factory.create(schema, { projectRoles: ['admin'] }, project)).schema.t.Article).not.toBe(evicted.type)
})

test('once most schemas of a generation are evicted, new schemas no longer share its interned data', async () => {
	const factory = createFactory([], undefined, new ContentApiSpecificCache<Schema, GraphQLSchemaFactoryResult>({ maxEntries: 1 }))
	const first = await buildAndForget(factory, manyRolesSchema, 'role0', 'Article0')
	await buildAndForget(factory, manyRolesSchema, 'role1', 'Article1')
	expect(await isCollected(first.built)).toBe(true)
	// 16 evictions start a new generation; the extra roles leave room for a schema the collector keeps for a while
	for (let i = 2; i < 20; i++) {
		await buildAndForget(factory, manyRolesSchema, `role${i}`, `Article${i}`)
		await collectGarbage()
	}

	expect(jsonSchemaOf(await factory.create(manyRolesSchema, { projectRoles: ['role0'] }, project)).schema.t.Article0).not.toBe(first.type)
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
