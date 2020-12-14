import { Builder, Container } from '@contember/dic'
import { Acl, Schema } from '@contember/schema'
import { Context } from '../types'
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
import { getArgumentValues } from 'graphql/execution/values'
import { createMapperContainer } from '../mapper'

export interface ExecutionContainer {
	readResolver: ReadResolver
	mutationResolver: MutationResolver
	validationResolver: ValidationResolver
}

export class ExecutionContainerFactory {
	constructor(
		private readonly schema: Schema,
		private readonly permissions: Acl.Permissions,
		private readonly providers: Providers,
		private readonly argumentValuesResolver: typeof getArgumentValues,
		private readonly setupSystemVariables: (db: Client) => Promise<void>,
	) {}

	public create(context: Pick<Context, 'db' | 'identityVariables'>): Container<ExecutionContainer> {
		const mapperContainer = createMapperContainer({
			permissions: this.permissions,
			identityVariables: context.identityVariables,
			providers: this.providers,
			schema: this.schema,
		})
		const innerDic = new Builder({})
			.addService('db', () => context.db)
			.addService('providers', () => this.providers)
			.addService('mapperFactory', () => mapperContainer.mapperFactory)
			.addService('queryAstFactory', () => new GraphQlQueryAstFactory(this.argumentValuesResolver))
			.addService(
				'readResolver',
				({ db, mapperFactory, queryAstFactory }) => new ReadResolver(db, mapperFactory, queryAstFactory),
			)
			.addService('validationDependencyCollector', () => new DependencyCollector())
			.addService('validationQueryAstFactory', () => new QueryAstFactory(this.schema.model))
			.addService(
				'dataSelector',
				({ validationQueryAstFactory }) => new ValidationDataSelector(this.schema.model, validationQueryAstFactory),
			)
			.addService('columnValueResolver', ({ providers }) => new ColumnValueResolver(providers))
			.addService('entityRulesResolver', () => new EntityRulesResolver(this.schema.validation, this.schema.model))
			.addService(
				'inputPreValidator',
				({ entityRulesResolver, columnValueResolver, dataSelector }) =>
					new InputPreValidator(this.schema.model, entityRulesResolver, columnValueResolver, dataSelector),
			)
			.addService(
				'mutationResolver',
				({ db, mapperFactory, inputPreValidator, queryAstFactory }) =>
					new MutationResolver(db, mapperFactory, this.setupSystemVariables, inputPreValidator, queryAstFactory),
			)
			.addService(
				'validationResolver',
				({ inputPreValidator, db, mapperFactory }) => new ValidationResolver(db, mapperFactory, inputPreValidator),
			)

			.build()

		return innerDic.pick('readResolver', 'mutationResolver', 'validationResolver')
	}
}
