import { PredicateFactory, PredicatesInjector, VariableInjector } from './acl'
import {
	ConditionBuilder,
	FieldsVisitorFactory,
	JoinBuilder,
	MetaHandler,
	OrderByBuilder,
	RelationFetcher,
	WhereBuilder,
} from './mapper/select'
import { UniqueWhereExpander } from './inputProcessing'
import { HasManyToHasOneReducer, HasManyToHasOneReducerExecutionHandler } from './extensions'
import {
	DeleteExecutor,
	InsertBuilderFactory,
	Inserter,
	JunctionConnectHandler,
	JunctionDisconnectHandler,
	JunctionTableManager,
	MapperFactory,
	PathFactory,
	SelectBuilder,
	SelectBuilderFactory,
	SelectHydrator,
	UpdateBuilderFactory,
	Updater,
} from './mapper'
import { Builder } from '@contember/dic'
import { Acl, Model, Schema } from '@contember/schema'
import { Client, SelectBuilder as DbSelectBuilder } from '@contember/database'
import { Providers, SchemaDatabaseMetadata } from '@contember/schema-utils'
import { PaginatedHasManyExecutionHandler } from './extensions/paginatedHasMany/PaginatedHasManyExecutionHandler'
import { PaginatedHasManyFieldProvider } from './extensions/paginatedHasMany/PaginatedHasManyFieldProvider'
import { WhereOptimizer } from './mapper/select/optimizer/WhereOptimizer'
import { ConditionOptimizer } from './mapper/select/optimizer/ConditionOptimizer'
import { GraphQlQueryAstFactory, MutationResolver, ReadResolver, ValidationResolver } from './resolvers'
import {
	ColumnValueResolver,
	DependencyCollector,
	EntityRulesResolver, InputPreValidator,
	QueryAstFactory,
	ValidationDataSelector,
} from './input-validation'

export type ExecutionContainerArgs = {
	schema: Schema & { id: number }
	schemaDatabaseMetadata: SchemaDatabaseMetadata
	db: Client
	identityId: string
	identityVariables: Acl.VariablesMap
	permissions: Acl.Permissions
	systemSchema: string
	project: { slug: string }
	stage: { id: string; slug: string }
}

export interface ExecutionContainer {
	readResolver: ReadResolver
	mutationResolver: MutationResolver
	validationResolver: ValidationResolver
}

export type ExecutionContainerBuilder = ReturnType<ExecutionContainerFactory['createBuilderInternal']>
export type ExecutionContainerHook = (builder: ExecutionContainerBuilder) => ExecutionContainerBuilder

export class ExecutionContainerFactory {
	public readonly hooks: ExecutionContainerHook[] = []

	constructor(
		private readonly providers: Providers,
	) {
	}

	createBuilder(args: ExecutionContainerArgs): ExecutionContainerBuilder {
		const builder = this.createBuilderInternal(args)
		return this.hooks.reduce((acc, cb) => cb(acc), builder)
	}

	createBuilderInternal({ permissions, identityVariables, identityId, db, schema, systemSchema, stage, project, schemaDatabaseMetadata }: ExecutionContainerArgs) {
		return new Builder({})
			.addService('systemSchema', () =>
				systemSchema)
			.addService('db', () =>
				db)
			.addService('project', () =>
				project)
			.addService('stage', () =>
				stage)
			.addService('schema', () =>
				schema)
			.addService('schemaDatabaseMetadata', () =>
				schemaDatabaseMetadata)
			.addService('providers', () =>
				this.providers)
			.addService('variableInjector', ({ schema }) =>
				new VariableInjector(schema.model, identityVariables))
			.addService('predicateFactory', ({ variableInjector, schema }) =>
				new PredicateFactory(permissions, schema.model, variableInjector))
			.addService('predicatesInjector', ({ predicateFactory, schema }) =>
				new PredicatesInjector(schema.model, predicateFactory))
			.addService('joinBuilder', ({ schema }) =>
				new JoinBuilder(schema.model))
			.addService('conditionBuilder', () =>
				new ConditionBuilder())
			.addService('pathFactory', () =>
				new PathFactory())
			.addService('whereOptimized', ({ schema }) =>
				new WhereOptimizer(schema.model, new ConditionOptimizer()))
			.addService('whereBuilder', ({ joinBuilder, conditionBuilder, pathFactory, whereOptimized, schema }) =>
				new WhereBuilder(
					schema.model,
					joinBuilder,
					conditionBuilder,
					pathFactory,
					whereOptimized,
					(schema.settings.content?.useExistsInHasManyFilter ?? schema.settings.useExistsInHasManyFilter) === true,
				))
			.addService('orderByBuilder', ({ joinBuilder, schema }) =>
				new OrderByBuilder(schema.model, joinBuilder))
			.addService('relationFetcher', ({ whereBuilder, orderByBuilder, predicatesInjector, pathFactory }) =>
				new RelationFetcher(whereBuilder, orderByBuilder, predicatesInjector, pathFactory))
			.addService('fieldsVisitorFactory', ({ relationFetcher, predicateFactory, whereBuilder, schema }) =>
				new FieldsVisitorFactory(schema.model, relationFetcher, predicateFactory, whereBuilder))
			.addService('metaHandler', ({ whereBuilder, predicateFactory }) =>
				new MetaHandler(whereBuilder, predicateFactory))
			.addService('uniqueWhereExpander', ({ schema }) =>
				new UniqueWhereExpander(schema.model))
			.addService('hasManyToHasOneReducer', ({ uniqueWhereExpander, schema }) =>
				new HasManyToHasOneReducerExecutionHandler(schema.model, uniqueWhereExpander))
			.addService('paginatedHasManyExecutionHandler', ({ relationFetcher, schema }) =>
				new PaginatedHasManyExecutionHandler(schema.model, relationFetcher))
			.addService('selectHandlers', ({ hasManyToHasOneReducer, paginatedHasManyExecutionHandler }) => ({
				[HasManyToHasOneReducer.extensionName]: hasManyToHasOneReducer,
				[PaginatedHasManyFieldProvider.extensionName]: paginatedHasManyExecutionHandler,
			}))
			.addService('selectBuilderFactory', ({ whereBuilder, orderByBuilder, fieldsVisitorFactory, metaHandler, selectHandlers, pathFactory, predicateFactory, schema }) =>
				new (class implements SelectBuilderFactory {
					create(qb: DbSelectBuilder, hydrator: SelectHydrator, relationPath: Model.AnyRelationContext[]): SelectBuilder {
						return new SelectBuilder(
							schema.model,
							whereBuilder,
							orderByBuilder,
							metaHandler,
							qb,
							hydrator,
							fieldsVisitorFactory,
							selectHandlers,
							pathFactory,
							relationPath,
							predicateFactory,
						)
					}
				})())
			.addService('insertBuilderFactory', ({ whereBuilder, pathFactory, schema, predicateFactory }) =>
				new InsertBuilderFactory(schema.model, whereBuilder, pathFactory, predicateFactory))
			.addService('updateBuilderFactory', ({ whereBuilder, pathFactory, schema, predicateFactory }) =>
				new UpdateBuilderFactory(schema.model, whereBuilder, pathFactory, predicateFactory))
			.addService('connectJunctionHandler', () =>
				new JunctionConnectHandler())
			.addService('disconnectJunctionHandler', ({}) =>
				new JunctionDisconnectHandler())
			.addService('junctionTableManager', ({ predicateFactory, whereBuilder, connectJunctionHandler, disconnectJunctionHandler, pathFactory, schema }) =>
				new JunctionTableManager(schema.model, predicateFactory, whereBuilder, connectJunctionHandler, disconnectJunctionHandler, pathFactory))
			.addService('deleteExecutor', ({ predicateFactory, updateBuilderFactory, whereBuilder, pathFactory, schema }) =>
				new DeleteExecutor(schema.model, predicateFactory, whereBuilder, updateBuilderFactory, pathFactory))
			.addService('updater', ({ predicateFactory, updateBuilderFactory, schema, schemaDatabaseMetadata }) =>
				new Updater(schema.model, schemaDatabaseMetadata, predicateFactory, updateBuilderFactory))
			.addService('inserter', ({  insertBuilderFactory, providers, schema, schemaDatabaseMetadata }) =>
				new Inserter(schema.model, schemaDatabaseMetadata, insertBuilderFactory, providers))
			.addService('mapperFactory', ({ predicatesInjector, selectBuilderFactory, uniqueWhereExpander, whereBuilder, junctionTableManager, deleteExecutor, updater, inserter, pathFactory, providers, schema, schemaDatabaseMetadata }) => {
				return new MapperFactory(
					db,
					identityId,
					schema.model,
					schemaDatabaseMetadata,
					predicatesInjector,
					selectBuilderFactory,
					uniqueWhereExpander,
					whereBuilder,
					junctionTableManager,
					deleteExecutor,
					updater,
					inserter,
					pathFactory,
					providers,
				)
			})

			.addService('queryAstFactory', () =>
				new GraphQlQueryAstFactory())
			.addService('readResolver', ({ mapperFactory, queryAstFactory }) =>
				new ReadResolver(mapperFactory, queryAstFactory))
			.addService('validationDependencyCollector', () =>
				new DependencyCollector())
			.addService('validationQueryAstFactory', ({ schema }) =>
				new QueryAstFactory(schema.model))
			.addService('dataSelector', ({ validationQueryAstFactory, schema }) =>
				new ValidationDataSelector(schema.model, validationQueryAstFactory))
			.addService('columnValueResolver', ({ providers }) =>
				new ColumnValueResolver(providers))
			.addService('entityRulesResolver', ({ schema }) =>
				new EntityRulesResolver(schema.validation, schema.model))
			.addService('inputPreValidator', ({ entityRulesResolver, columnValueResolver, dataSelector, schema }) =>
				new InputPreValidator(schema.model, entityRulesResolver, columnValueResolver, dataSelector))
			.addService('mutationResolver', ({ mapperFactory, inputPreValidator, queryAstFactory, schema, schemaDatabaseMetadata }) =>
				new MutationResolver(schema.model, mapperFactory, inputPreValidator, queryAstFactory, schemaDatabaseMetadata))
			.addService('validationResolver', ({ inputPreValidator, mapperFactory }) =>
				new ValidationResolver(mapperFactory, inputPreValidator))
	}

	public create(args: ExecutionContainerArgs): ExecutionContainer {
		return this.createBuilder(args).build().pick('validationResolver', 'readResolver', 'mutationResolver')
	}
}

