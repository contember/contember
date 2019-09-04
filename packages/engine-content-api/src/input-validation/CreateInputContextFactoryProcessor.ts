import CreateInputProcessor from '../inputProcessing/CreateInputProcessor'
import * as Context from '../inputProcessing/InputContext'
import { Input, Model } from '@contember/schema'
import ValidationContextFactory from './ValidationContextFactory'
import DependencyCollector from './DependencyCollector'
import ValidationDataSelector from './ValidationDataSelector'
import { NoDataError, Providers, resolveColumnValue } from '@contember/schema-utils'

type Result = any

export default class CreateInputContextFactoryProcessor implements CreateInputProcessor<Result> {
	constructor(
		private readonly validationContextFactory: ValidationContextFactory,
		private readonly dependencies: DependencyCollector.Dependencies,
		private readonly dataSelector: ValidationDataSelector,
		private readonly providers: Providers,
	) {}

	manyHasManyInversed: CreateInputProcessor.HasManyRelationProcessor<Context.ManyHasManyInversedContext, Result> = {
		connect: async context => this.processConnect(context),
		create: async context => this.processCreate(context),
	}

	manyHasManyOwner: CreateInputProcessor.HasManyRelationProcessor<Context.ManyHasManyOwnerContext, Result> = {
		connect: async context => this.processConnect(context),
		create: async context => this.processCreate(context),
	}

	manyHasOne: CreateInputProcessor.HasOneRelationProcessor<Context.ManyHasOneContext, Result> = {
		connect: async context => this.processConnect(context),
		create: async context => this.processCreate(context),
	}

	oneHasMany: CreateInputProcessor.HasManyRelationProcessor<Context.OneHasManyContext, Result> = {
		connect: async context => this.processConnect(context),
		create: async context => this.processCreate(context),
	}
	oneHasOneInversed: CreateInputProcessor.HasOneRelationProcessor<Context.OneHasOneInversedContext, Result> = {
		connect: async context => this.processConnect(context),
		create: async context => this.processCreate(context),
	}
	oneHasOneOwner: CreateInputProcessor.HasOneRelationProcessor<Context.OneHasOneOwnerContext, Result> = {
		connect: async context => this.processConnect(context),
		create: async context => this.processCreate(context),
	}

	async processCreate(context: {
		targetEntity: Model.Entity
		relation: Model.AnyRelation
		input: Input.CreateDataInput
	}) {
		const dependency = this.dependencies[context.relation.name]
		return this.validationContextFactory.createForCreate(context.targetEntity, context.input, dependency)
	}

	async processConnect(context: { targetEntity: Model.Entity; relation: Model.AnyRelation; input: Input.UniqueWhere }) {
		const dependency = this.dependencies[context.relation.name]
		return this.dataSelector.select(context.targetEntity, context.input, dependency)
	}

	async column(context: Context.ColumnContext): Promise<Result> {
		if (context.column.name === context.entity.primary) {
			return '00000000-0000-0000-0000-000000000000'
		}
		try {
			return resolveColumnValue(context, this.providers)
		} catch (e) {
			if (e instanceof NoDataError) {
				return undefined
			}
			throw e
		}
	}
}
