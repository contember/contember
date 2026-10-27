import {
	Authorizator,
	ContextualPermissions,
	createGraphQLJsBridge,
	createJsonIntrospectionExtension,
	EntityRulesResolver,
	IntrospectionSchemaFactory,
	JsonContentSchema,
	JsonContentSchemaBuilder,
	JsonContentSchemaShared,
	PermissionFactory,
} from '@contember/engine-content-api'
import { Acl, Schema } from '@contember/schema'
import { createHash } from 'node:crypto'
import { GraphQLSchemaContributor } from './GraphQLSchemaContributor.js'
import { Identity } from './Identity.js'
import { ContentApiSpecificCache } from './ContentApiSpecificCache.js'
import { ProjectConfig } from '../project/config.js'

export interface GraphQLSchemaFactoryResult {
	permissions: Acl.Permissions
	allPermissions?: Acl.Permissions
	schema: JsonContentSchema
}

/**
 * Schemas of one model built against one shared state. Its interner keeps everything it interned, also the data of
 * schemas the cache has evicted, so the state is replaced once evictions dominate and freed when none is in use.
 */
interface SharedGeneration {
	readonly shared: JsonContentSchemaShared
	readonly built: WeakRef<JsonContentSchema>[]
}

// A new generation interns the role-independent part again, which costs about as much as the unique data of ~10 roles.
const MIN_EVICTED_FOR_NEW_GENERATION = 16

// A large model with permissive roles takes seconds to build; other requests of the process wait at most one slice.
const BUILD_SLICE_MS = 10

/** Between slices, `setImmediate` lets the event loop run I/O; a microtask (`process.nextTick`, a promise) would not. */
const runInSlices = async <T>(steps: Generator<void, T>): Promise<T> => {
	let sliceEnd = performance.now() + BUILD_SLICE_MS
	for (;;) {
		const step = steps.next()
		if (step.done) {
			return step.value
		}
		if (performance.now() >= sliceEnd) {
			await new Promise<void>(resolve => setImmediate(resolve))
			sliceEnd = performance.now() + BUILD_SLICE_MS
		}
	}
}

export class GraphQlSchemaFactory {
	private readonly permissionsKeys = new WeakMap<Schema, Map<string, string>>()
	/** Weak, so that only the cached schemas keep their generation alive (via `generationOf`). */
	private readonly generations = new WeakMap<Schema, WeakRef<SharedGeneration>>()
	private readonly generationOf = new WeakMap<JsonContentSchema, SharedGeneration>()
	/** Builds in progress, so that concurrent requests of one role combination build it once. */
	private readonly building = new WeakMap<Schema, Map<string, Promise<GraphQLSchemaFactoryResult>>>()

	constructor(
		private readonly cache: ContentApiSpecificCache<Schema, GraphQLSchemaFactoryResult>,
		private readonly permissionFactory: PermissionFactory,
		private readonly schemaContributors: GraphQLSchemaContributor[],
	) {}

	public async create(schema: Schema, identity: Identity, project: ProjectConfig): Promise<GraphQLSchemaFactoryResult> {
		const { permissionsKey, computedPermissions } = this.getPermissionsKey(schema, identity.projectRoles)
		const contributorsKey = this.schemaContributors.map(it => it.getCacheKey?.({ schema, identity, project }) ?? '').join('\xff')
		const cacheKey = `${permissionsKey}\xff\xff${contributorsKey}`

		const cached = this.cache.get(schema, cacheKey)
		if (cached) {
			return cached
		}
		let building = this.building.get(schema)
		if (!building) {
			building = new Map()
			this.building.set(schema, building)
		}
		const inProgress = building.get(cacheKey)
		if (inProgress) {
			return await inProgress
		}
		const build = this.build(schema, identity, project, computedPermissions)
		building.set(cacheKey, build)
		try {
			return this.cache.set(schema, cacheKey, await build)
		} finally {
			building.delete(cacheKey)
		}
	}

	private async build(
		schema: Schema,
		identity: Identity,
		project: ProjectConfig,
		computedPermissions: ContextualPermissions | undefined,
	): Promise<GraphQLSchemaFactoryResult> {
		const { root: permissions, all: allPermissions } = computedPermissions ?? this.permissionFactory.createContextual(schema, identity.projectRoles)

		const customPrimary = schema.acl.customPrimary ?? false
		const refreshMaterializedView = this.permissionFactory.isRefreshMaterializedViewAllowed(schema, identity.projectRoles)
		// Types are shaped by the nested set, so a field granted only through a relation still exists
		// on the shared type; the root query and mutation fields are gated on the root set alone.
		const authorizator = new Authorizator(allPermissions, customPrimary, refreshMaterializedView)
		const rootAuthorizator = new Authorizator(permissions, customPrimary, refreshMaterializedView)
		const introspectionSchemaFactory = new IntrospectionSchemaFactory(
			schema.model,
			new EntityRulesResolver(schema.validation, schema.model),
			authorizator,
		)
		const otherSchemas = this.schemaContributors
			.map(it => it.createSchema({ schema, identity, project }))
			.filter(<T>(it: T | undefined): it is T => it !== undefined)

		const generation = this.getGeneration(schema)
		const builder = new JsonContentSchemaBuilder(schema.model, authorizator, rootAuthorizator, generation.shared)
		const jsonSchema = await runInSlices(builder.buildSteps([
			createJsonIntrospectionExtension(introspectionSchemaFactory),
			...otherSchemas.map(createGraphQLJsBridge),
		]))
		generation.built.push(new WeakRef(jsonSchema))
		this.generationOf.set(jsonSchema, generation)
		return { schema: jsonSchema, permissions, allPermissions }
	}

	private getGeneration(schema: Schema): SharedGeneration {
		const current = this.generations.get(schema)?.deref()
		if (current) {
			const evicted = current.built.filter(it => it.deref() === undefined).length
			if (evicted < MIN_EVICTED_FOR_NEW_GENERATION || evicted < current.built.length - evicted) {
				return current
			}
		}
		const generation: SharedGeneration = { shared: new JsonContentSchemaShared(), built: [] }
		this.generations.set(schema, new WeakRef(generation))
		return generation
	}

	// Role combinations with identical permissions share one GraphQL schema. The key is memoized per combination,
	// so a request does not rebuild the permissions only to find its schema.
	private getPermissionsKey(
		schema: Schema,
		roles: readonly string[],
	): { permissionsKey: string; computedPermissions?: ContextualPermissions } {
		let keysByRoles = this.permissionsKeys.get(schema)
		if (!keysByRoles) {
			keysByRoles = new Map()
			this.permissionsKeys.set(schema, keysByRoles)
		}
		const rolesKey = [...roles].sort().join('\xff')
		const cachedKey = keysByRoles.get(rolesKey)
		if (cachedKey !== undefined) {
			return { permissionsKey: cachedKey }
		}
		const computedPermissions = this.permissionFactory.createContextual(schema, roles)
		const refreshMaterializedView = this.permissionFactory.isRefreshMaterializedViewAllowed(schema, roles)
		const permissionsKey = createHash('sha256')
			.update(JSON.stringify([computedPermissions.root, computedPermissions.all, refreshMaterializedView]))
			.digest('hex')
		keysByRoles.set(rolesKey, permissionsKey)
		return { permissionsKey, computedPermissions }
	}
}
