import { Acl, Input, Model, Result } from '@contember/schema'
import { ResolveInfo, ResolverFn, ResolverMap, ScalarMap, Schema, Type, withBuiltInScalars } from '@contember/graphql-json'
import { Authorizator } from '../acl/index.js'
import { Context } from '../types.js'
import { GqlTypeName } from '../schema/utils.js'
import { EntityInputType } from '../schema/mutations/index.js'
import { ExtensionKey, Operation, OperationMeta } from '../schema/OperationExtension.js'
import { mutationResultQueryAstFilter, TransactionOptions, transactionQueryAstFilter } from '../resolvers/MutationResolver.js'
import { ImplementationException } from '../exception.js'
import { JsonColumnTypes } from './JsonColumnTypes.js'
import { JsonFilterTypes } from './JsonFilterTypes.js'
import { aliasAwareResolver, JsonEntityTypes } from './JsonEntityTypes.js'
import { JsonInputTypes } from './JsonInputTypes.js'
import { JsonQueryAstFactory } from './JsonQueryAstFactory.js'
import {
	JsonOutputField,
	JsonTypeRegistry,
	listOfNonNullRef,
	namedRef,
	nonNullListOfNonNullListOfNonNullRef,
	nonNullListOfNonNullRef,
	nonNullRef,
} from './JsonTypeRegistry.js'

/** Fields and types merged into the content schema, e.g. the `schema` introspection query. */
export interface JsonSchemaExtension {
	types: Record<string, Type>
	queries?: Record<string, JsonOutputField>
	mutations?: Record<string, JsonOutputField>
	resolvers?: ResolverMap<Context>
	scalars?: ScalarMap
}

/** Coerces the field arguments without walking the selection, which may contain unions. */
const argumentsOnly = (node: unknown, path: string[]): boolean => path.length === 0

export interface JsonContentSchema {
	schema: Schema
	resolvers: ResolverMap<Context>
	scalars: ScalarMap
}

/**
 * Builds the content schema as plain JSON for `@contember/graphql-json`, without graphql-js type instances.
 * Mirrors `GraphQlSchemaBuilder` and its providers; `graphQlSchemaJson.test.ts` keeps the two in sync.
 */
export class JsonContentSchemaBuilder {
	private readonly registry = new JsonTypeRegistry()
	private readonly columnTypes: JsonColumnTypes
	private readonly filterTypes: JsonFilterTypes
	private readonly entityTypes: JsonEntityTypes
	private readonly inputTypes: JsonInputTypes
	private queryAstFactory: JsonQueryAstFactory | undefined

	constructor(
		private readonly schema: Model.Schema,
		private readonly authorizator: Authorizator,
		private readonly rootAuthorizator: Authorizator,
	) {
		this.columnTypes = new JsonColumnTypes(schema, this.registry)
		this.filterTypes = new JsonFilterTypes(schema, authorizator, this.registry, this.columnTypes)
		this.entityTypes = new JsonEntityTypes(schema, authorizator, rootAuthorizator, this.registry, this.columnTypes, this.filterTypes)
		this.inputTypes = new JsonInputTypes(schema, authorizator, this.registry, this.columnTypes, this.filterTypes)
	}

	public build(extensions: readonly JsonSchemaExtension[] = []): JsonContentSchema {
		const registry = this.registry
		// graphql-js always includes these two, introspection depends on them
		registry.scalar('String', undefined)
		registry.scalar('Boolean', undefined)

		const queries: Record<string, JsonOutputField> = {}
		const mutations: Record<string, JsonOutputField> = {}
		for (const extension of extensions) {
			Object.assign(registry.types, extension.types)
			Object.assign(queries, extension.queries)
			Object.assign(mutations, extension.mutations)
			Object.assign(registry.scalars, extension.scalars)
			for (const [typeName, typeResolvers] of Object.entries(extension.resolvers ?? {})) {
				registry.resolvers[typeName] = { ...registry.resolvers[typeName], ...typeResolvers }
			}
		}

		for (const entity of Object.values(this.schema.entities)) {
			Object.assign(queries, this.getQueries(entity))
			Object.assign(queries, this.getValidationQueries(entity))
			Object.assign(mutations, this.getMutations(entity))
		}

		const boolean = namedRef(registry.scalar('Boolean', undefined))
		const string = namedRef(registry.scalar('String', undefined))

		if (Object.keys(queries).length > 0) {
			const queryTransaction = registry.object('QueryTransaction', () => ({ ...queries }))
			queries.transaction = {
				type: namedRef(queryTransaction),
				resolve: (parent, args, context, info) =>
					context.timer(
						`GraphQL.query.${info.fieldName}`,
						() => context.executionContainer.readResolver.resolveTransaction(this.getQueryAstFactory().create(info)),
					),
			}
		}
		const hasMutations = Object.keys(mutations).length > 0
		if (hasMutations) {
			const transactionMutations = { ...mutations }
			const options = registry.inputObject('MutationTransactionOptions', () => ({
				deferForeignKeyConstraints: [boolean],
				deferUniqueConstraints: [boolean],
			}))
			const mutationTransaction = registry.object('MutationTransaction', () => ({
				ok: { type: nonNullRef('Boolean') },
				errorMessage: { type: string },
				errors: { type: this.getErrorListType() },
				validation: { type: nonNullRef(this.getValidationResultType()) },
				...transactionMutations,
				query: { type: namedRef('Query') },
			}))
			mutations.transaction = {
				type: nonNullRef(mutationTransaction),
				args: { options: [namedRef(options)] },
				resolve: (parent, args, context, info) =>
					context.timer(`GraphQL.mutation.${info.fieldName}`, () => {
						const queryAst = this.getQueryAstFactory().create<{ options?: TransactionOptions }>(info, transactionQueryAstFilter)
						return context.executionContainer.mutationResolver.resolveTransaction(queryAst, {
							deferForeignKeyConstraints: queryAst.args.options?.deferForeignKeyConstraints ?? false,
							deferUniqueConstraints: queryAst.args.options?.deferUniqueConstraints ?? false,
						})
					}),
			}
			mutations.query = {
				type: nonNullRef('Query'),
				resolve: (parent, args, context, info) => context.executionContainer.readResolver.resolveQuery(this.getQueryAstFactory().create(info)),
			}
		}

		const refreshViewMutation = this.getRefreshViewMutation()
		if (refreshViewMutation) {
			mutations.refreshMaterializedView = refreshViewMutation
		}

		const info = registry.object('Info', () => ({ description: { type: string } }))
		queries._info = { type: namedRef(info), resolve: () => ({ description: 'TODO' }) }

		registry.object('Query', () => queries)
		if (hasMutations || refreshViewMutation) {
			registry.object('Mutation', () => mutations)
		}

		const roots = ['Query', 'Mutation', 'String', 'Boolean', ...extensions.flatMap(it => Object.keys(it.types))]
		registry.pruneUnreachable(roots)

		const schema: Schema = {
			q: 'Query',
			m: registry.has('Mutation') ? 'Mutation' : null,
			s: null,
			t: registry.types,
		}
		const scalars = withBuiltInScalars(registry.scalars)
		this.queryAstFactory = new JsonQueryAstFactory(schema, scalars, registry.extensions)
		return { schema, resolvers: registry.resolvers, scalars }
	}

	private getQueryAstFactory(): JsonQueryAstFactory {
		if (!this.queryAstFactory) {
			throw new ImplementationException('JsonContentSchemaBuilder: schema is not built')
		}
		return this.queryAstFactory
	}

	private getQueries(entity: Model.Entity): Record<string, JsonOutputField> {
		// Root entry points are gated on the root grants alone, see QueryProvider.
		if (this.rootAuthorizator.getEntityPermission(Acl.Operation.read, entity.name) === 'no') {
			return {}
		}
		const entityName = entity.name
		const entityType = this.entityTypes.getEntity(entityName)
		const uniqueWhere = this.filterTypes.getEntityUniqueWhereType(entityName)
		if (!uniqueWhere) {
			throw new ImplementationException()
		}
		const where = namedRef(this.filterTypes.getEntityWhereType(entityName))
		const int = namedRef(this.columnTypes.getScalar(Model.ColumnType.Int))
		return {
			['get' + entityName]: {
				type: namedRef(entityType),
				args: { by: [nonNullRef(uniqueWhere)], filter: [where] },
				extensions: { [ExtensionKey]: new OperationMeta(Operation.get, entity) },
				resolve: this.createRootResolver(
					'GraphQL.query',
					(context, info) => context.executionContainer.readResolver.resolveGetQuery(entity, this.getQueryAstFactory().create(info)),
				),
			},
			['list' + entityName]: {
				type: nonNullListOfNonNullRef(entityType),
				args: {
					filter: [where],
					orderBy: [listOfNonNullRef(this.filterTypes.getEntityOrderByType(entityName))],
					offset: [int],
					limit: [int],
				},
				extensions: { [ExtensionKey]: new OperationMeta(Operation.list, entity) },
				resolve: this.createRootResolver(
					'GraphQL.query',
					(context, info) => context.executionContainer.readResolver.resolveListQuery(entity, this.getQueryAstFactory().create(info)),
				),
			},
			['paginate' + entityName]: {
				...this.entityTypes.createPaginatedField(entityName),
				extensions: { [ExtensionKey]: new OperationMeta(Operation.paginate, entity) },
				resolve: this.createRootResolver(
					'GraphQL.query',
					(context, info) => context.executionContainer.readResolver.resolvePaginationQuery(entity, this.getQueryAstFactory().create(info)),
				),
			},
		}
	}

	private getValidationQueries(entity: Model.Entity): Record<string, JsonOutputField> {
		const fields: Record<string, JsonOutputField> = {}
		const createInput = this.inputTypes.getInput(EntityInputType.create, entity.name)
		const validationResult = nonNullRef(this.getValidationResultType())
		if (createInput !== undefined) {
			fields[`validateCreate${entity.name}`] = {
				type: validationResult,
				args: { data: [nonNullRef(createInput)] },
				resolve: (parent, args, context, info) =>
					context.timer(
						`GraphQL.query.${info.fieldName}`,
						() =>
							context.executionContainer.validationResolver.validateCreate(
								entity,
								this.getQueryAstFactory().create<Input.CreateInput>(info, argumentsOnly).args,
							),
					),
			}
		}
		const updateInput = this.inputTypes.getInput(EntityInputType.update, entity.name)
		const uniqueWhere = this.filterTypes.getEntityUniqueWhereType(entity.name)
		if (updateInput !== undefined && uniqueWhere !== undefined) {
			fields[`validateUpdate${entity.name}`] = {
				type: validationResult,
				args: { by: [nonNullRef(uniqueWhere)], data: [nonNullRef(updateInput)] },
				resolve: (parent, args, context, info) =>
					context.timer(
						`GraphQL.query.${info.fieldName}`,
						() =>
							context.executionContainer.validationResolver.validateUpdate(
								entity,
								this.getQueryAstFactory().create<Input.UpdateInput>(info, argumentsOnly).args,
							),
					),
			}
		}
		return fields
	}

	/** Mirrors `MutationProvider`. */
	private getMutations(entity: Model.Entity): Record<string, JsonOutputField> {
		const entityName = entity.name
		const mutations: Record<string, JsonOutputField> = {}
		const isLookupReadable = this.authorizator.getEntityPermission(Acl.Operation.read, entityName) !== 'no'
		const rootAllows = (operation: Acl.Operation) => this.rootAuthorizator.getEntityPermission(operation, entityName) !== 'no'
		const createMutationResolver = (resolve: (context: Context, info: ResolveInfo) => Promise<unknown>) =>
			this.createRootResolver('GraphQL.mutation', resolve)
		const createAst = (info: ResolveInfo) => this.getQueryAstFactory().create(info, mutationResultQueryAstFilter)

		if (rootAllows(Acl.Operation.create)) {
			const dataType = this.inputTypes.getInput(EntityInputType.create, entityName)
			if (dataType !== undefined) {
				mutations[`create${entityName}`] = {
					type: nonNullRef(this.createResultType(entityName, 'create')),
					args: { data: [nonNullRef(dataType)] },
					extensions: { [ExtensionKey]: new OperationMeta(Operation.create, entity) },
					resolve: createMutationResolver((context, info) => context.executionContainer.mutationResolver.resolveCreate(entity, createAst(info))),
				}
			}
		}

		const uniqueWhere = this.filterTypes.getEntityUniqueWhereType(entityName)
		if (!entity.view && isLookupReadable && rootAllows(Acl.Operation.delete) && uniqueWhere) {
			mutations[`delete${entityName}`] = {
				type: nonNullRef(this.createResultType(entityName, 'delete')),
				args: {
					by: [nonNullRef(uniqueWhere)],
					filter: [namedRef(this.filterTypes.getEntityWhereType(entityName))],
				},
				extensions: { [ExtensionKey]: new OperationMeta(Operation.delete, entity) },
				resolve: createMutationResolver((context, info) => context.executionContainer.mutationResolver.resolveDelete(entity, createAst(info))),
			}
		}

		if (isLookupReadable && rootAllows(Acl.Operation.update)) {
			const dataType = this.inputTypes.getInput(EntityInputType.update, entityName)
			if (dataType !== undefined) {
				const resultType = this.createResultType(entityName, 'update')
				if (uniqueWhere) {
					mutations[`update${entityName}`] = {
						type: nonNullRef(resultType),
						args: {
							by: [nonNullRef(uniqueWhere)],
							filter: [namedRef(this.filterTypes.getEntityWhereType(entityName))],
							data: [nonNullRef(dataType)],
						},
						extensions: { [ExtensionKey]: new OperationMeta(Operation.update, entity) },
						resolve: createMutationResolver((context, info) => context.executionContainer.mutationResolver.resolveUpdate(entity, createAst(info))),
					}
				}
			}
		}

		if (isLookupReadable && rootAllows(Acl.Operation.update) && rootAllows(Acl.Operation.create)) {
			const createInput = this.inputTypes.getInput(EntityInputType.create, entityName)
			const updateInput = this.inputTypes.getInput(EntityInputType.update, entityName)
			if (createInput !== undefined && updateInput !== undefined) {
				const resultType = this.createResultType(entityName, 'upsert')
				if (uniqueWhere) {
					mutations[`upsert${entityName}`] = {
						type: nonNullRef(resultType),
						args: {
							by: [nonNullRef(uniqueWhere)],
							filter: [namedRef(this.filterTypes.getEntityWhereType(entityName))],
							update: [nonNullRef(updateInput)],
							create: [nonNullRef(createInput)],
						},
						extensions: { [ExtensionKey]: new OperationMeta(Operation.upsert, entity) },
						resolve: createMutationResolver((context, info) => context.executionContainer.mutationResolver.resolveUpsert(entity, createAst(info))),
					}
				}
			}
		}
		return mutations
	}

	/** Root fields are also nested in `transaction`, where the parent already holds the result. */
	private createRootResolver(timerPrefix: string, resolve: (context: Context, info: ResolveInfo) => Promise<unknown>): ResolverFn<unknown, Context> {
		return (parent, args, context, info) =>
			context.timer(`${timerPrefix}.${info.fieldName}`, () => {
				if (parent) {
					return aliasAwareResolver(parent, args, context, info)
				}
				return resolve(context, info)
			})
	}

	private createResultType(entityName: string, operation: 'create' | 'update' | 'delete' | 'upsert'): string {
		const mutationResult = this.getMutationResultType()
		return this.registry.object(GqlTypeName`${entityName}${operation}Result`, () => {
			const fields: Record<string, JsonOutputField> = {
				ok: { type: nonNullRef('Boolean') },
				errorMessage: { type: namedRef('String') },
				errors: { type: this.getErrorListType() },
			}
			if (this.authorizator.getEntityPermission(Acl.Operation.read, entityName) !== 'no') {
				fields.node = { type: namedRef(this.entityTypes.getEntity(entityName)), resolve: aliasAwareResolver }
			}
			if (operation !== 'delete') {
				fields.validation = { type: nonNullRef(this.getValidationResultType()) }
			}
			return fields
		}, [mutationResult])
	}

	/** Mirrors `ResultSchemaTypeProvider`. */
	private getPathFragmentType(): string {
		const string = namedRef(this.registry.scalar('String', undefined))
		const int = this.columnTypes.getScalar(Model.ColumnType.Int)
		return this.registry.union('_PathFragment', [
			this.registry.object('_FieldPathFragment', () => ({ field: { type: nonNullRef('String') } })),
			this.registry.object('_IndexPathFragment', () => ({ index: { type: nonNullRef(int) }, alias: { type: string } })),
		])
	}

	private getValidationResultType(): string {
		const pathFragment = this.getPathFragmentType()
		const validationMessage = this.registry.object('_ValidationMessage', () => ({ text: { type: nonNullRef('String') } }))
		const validationError = this.registry.object('_ValidationError', () => ({
			path: { type: nonNullListOfNonNullRef(pathFragment) },
			message: { type: nonNullRef(validationMessage) },
		}))
		return this.registry.object('_ValidationResult', () => ({
			valid: { type: nonNullRef('Boolean') },
			errors: { type: nonNullListOfNonNullRef(validationError) },
		}))
	}

	private getErrorListType() {
		const pathFragment = this.getPathFragmentType()
		const errorType = this.registry.enum('_MutationErrorType', Object.values(Result.ExecutionErrorType))
		return nonNullListOfNonNullRef(this.registry.object('_MutationError', () => ({
			path: { type: nonNullListOfNonNullRef(pathFragment), deprecationReason: 'Use `paths`.' },
			paths: { type: nonNullListOfNonNullListOfNonNullRef(pathFragment) },
			type: { type: nonNullRef(errorType) },
			message: { type: namedRef('String') },
		})))
	}

	private getMutationResultType(): string {
		return this.registry.interface('MutationResult', () => ({
			ok: { type: nonNullRef('Boolean') },
			errorMessage: { type: namedRef('String') },
			errors: { type: this.getErrorListType() },
		}))
	}

	/** Mirrors `RefreshViewMutationProvider`. */
	private getRefreshViewMutation(): JsonOutputField | undefined {
		const materializedViews = Object.values(this.schema.entities)
			.filter(it => it.view?.materialized)
			.filter(it => this.authorizator.isRefreshMaterializedViewAllowed(it.name))
		if (materializedViews.length === 0) {
			return undefined
		}
		const boolean = namedRef(this.registry.scalar('Boolean', undefined))
		return {
			type: namedRef(this.registry.object('RefreshMaterializedViewResponse', () => ({ ok: { type: boolean } }))),
			args: {
				name: [namedRef(this.registry.enum('_MaterializedView', materializedViews.map(it => it.name)))],
				options: [namedRef(this.registry.inputObject('RefreshMaterializedViewOptions', () => ({ concurrently: [boolean] })))],
			},
			resolve: (parent, args, context, info) => {
				const ast = this.getQueryAstFactory().create<{ name: string; options?: { concurrently?: boolean } }>(info, argumentsOnly)
				return context.executionContainer.refreshViewResolver.resolve(ast.args.name, ast.args.options)
			},
		}
	}
}
