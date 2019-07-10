import CreateInputProcessor from '../inputProcessing/CreateInputProcessor'
import * as Context from '../inputProcessing/InputContext'
import { Input, Model } from 'cms-common'
import InputValidator from './InputValidator'
import { appendRelationToPath, ValidationPath } from './ValidationPath'

type Result = any
const NoResult = () => Promise.resolve([])

export default class CreateInputValidationProcessor implements CreateInputProcessor<Result> {
	constructor(private readonly inputValidator: InputValidator, private readonly path: ValidationPath) {}

	manyHasManyInversed: CreateInputProcessor.HasManyRelationProcessor<Context.ManyHasManyInversedContext, Result> = {
		connect: NoResult,
		create: context => this.validateCreate(context),
	}

	manyHasManyOwner: CreateInputProcessor.HasManyRelationProcessor<Context.ManyHasManyOwnerContext, Result> = {
		connect: NoResult,
		create: context => this.validateCreate(context),
	}

	manyHasOne: CreateInputProcessor.HasOneRelationProcessor<Context.ManyHasOneContext, Result> = {
		connect: NoResult,
		create: context => this.validateCreate(context),
	}

	oneHasMany: CreateInputProcessor.HasManyRelationProcessor<Context.OneHasManyContext, Result> = {
		connect: NoResult,
		create: context => this.validateCreate(context),
	}
	oneHasOneInversed: CreateInputProcessor.HasOneRelationProcessor<Context.OneHasOneInversedContext, Result> = {
		connect: NoResult,
		create: context => this.validateCreate(context),
	}
	oneHasOneOwner: CreateInputProcessor.HasOneRelationProcessor<Context.OneHasOneOwnerContext, Result> = {
		connect: NoResult,
		create: context => this.validateCreate(context),
	}

	async validateCreate(context: {
		targetEntity: Model.Entity
		relation: Model.AnyRelation
		input: Input.CreateDataInput
		targetRelation: Model.AnyRelation | null
		index?: number
		alias?: string
	}) {
		const newPath = appendRelationToPath(this.path, context.relation.name, context)
		return this.inputValidator.validateCreate(context.targetEntity, context.input, newPath, context.targetRelation)
	}

	async column(context: Context.ColumnContext): Promise<Result> {
		return []
	}
}
