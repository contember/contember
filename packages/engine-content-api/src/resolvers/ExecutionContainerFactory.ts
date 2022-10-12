import { Builder, Container } from '@contember/dic'
import { Acl, Schema } from '@contember/schema'
import { ReadResolver } from './ReadResolver'
import { MutationResolver } from './MutationResolver'
import { Client } from '@contember/database'
import {
	ColumnValueResolver,
	DependencyCollector,
	EntityRulesResolver,
	InputPreValidator,
	QueryAstFactory,
	ValidationDataSelector,
} from '../input-validation'
import { ValidationResolver } from './ValidationResolver'
import { Providers } from '@contember/schema-utils'
import { GraphQlQueryAstFactory } from './GraphQlQueryAstFactory'
import { MapperContainerFactory } from '../mapper'

export interface ExecutionContainer {
	readResolver: ReadResolver
	mutationResolver: MutationResolver
	validationResolver: ValidationResolver
}

export interface ExecutionContainerArgs {
	db: Client
	identityId: string
	identityVariables: Acl.VariablesMap
	schema: Schema
	permissions: Acl.Permissions
}

export class ExecutionContainerFactory {
	constructor(
		private readonly providers: Providers,
		private readonly mapperContainerFactory: MapperContainerFactory,
	) {}

	public create({ db, identityVariables, permissions, schema, identityId }: ExecutionContainerArgs): Container<ExecutionContainer> {
		const mapperContainer = this.mapperContainerFactory.create({ permissions, identityVariables, schema, db, identityId })
		const innerDic = new Builder({})
			.addService('db', () =>
				db)
			.addService('providers', () =>
				this.providers)
			.addService('mapperFactory', () =>
				mapperContainer.mapperFactory)
			.addService('queryAstFactory', () =>
				new GraphQlQueryAstFactory())
			.addService('readResolver', ({ mapperFactory, queryAstFactory }) =>
				new ReadResolver(mapperFactory, queryAstFactory))
			.addService('validationDependencyCollector', () =>
				new DependencyCollector())
			.addService('validationQueryAstFactory', () =>
				new QueryAstFactory(schema.model))
			.addService('dataSelector', ({ validationQueryAstFactory }) =>
				new ValidationDataSelector(schema.model, validationQueryAstFactory))
			.addService('columnValueResolver', ({ providers }) =>
				new ColumnValueResolver(providers))
			.addService('entityRulesResolver', () =>
				new EntityRulesResolver(schema.validation, schema.model))
			.addService('inputPreValidator', ({ entityRulesResolver, columnValueResolver, dataSelector }) =>
				new InputPreValidator(schema.model, entityRulesResolver, columnValueResolver, dataSelector))
			.addService('mutationResolver', ({ mapperFactory, inputPreValidator, queryAstFactory }) =>
				new MutationResolver(schema.model, mapperFactory, inputPreValidator, queryAstFactory))
			.addService('validationResolver', ({ inputPreValidator, mapperFactory }) =>
				new ValidationResolver(mapperFactory, inputPreValidator))
			.build()

		return innerDic.pick('readResolver', 'mutationResolver', 'validationResolver')
	}
}
