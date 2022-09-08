import { CreateInputProcessor } from '../../inputProcessing'
import { Input, Model } from '@contember/schema'
import { appendRelationToPath, ValidationPath } from '../ValidationPath'
import { Mapper } from '../../mapper'
import { InputPreValidator } from './InputPreValidator'

type Result = any
const NoResult = () => Promise.resolve([])

export class CreateInputPreValidationProcessor implements CreateInputProcessor<Result> {
	constructor(
		private readonly inputValidator: InputPreValidator,
		private readonly path: ValidationPath,
		private readonly mapper: Mapper,
	) {}

	manyHasManyInverse: CreateInputProcessor.HasManyRelationProcessor<Model.ManyHasManyInverseContext, Result> = {
		connect: NoResult,
		create: context => this.validateCreate(context),
	}

	manyHasManyOwning: CreateInputProcessor.HasManyRelationProcessor<Model.ManyHasManyOwningContext, Result> = {
		connect: NoResult,
		create: context => this.validateCreate(context),
	}

	manyHasOne: CreateInputProcessor.HasOneRelationProcessor<Model.ManyHasOneContext, Result> = {
		connect: NoResult,
		create: context => this.validateCreate(context),
	}

	oneHasMany: CreateInputProcessor.HasManyRelationProcessor<Model.OneHasManyContext, Result> = {
		connect: NoResult,
		create: context => this.validateCreate(context),
	}
	oneHasOneInverse: CreateInputProcessor.HasOneRelationProcessor<Model.OneHasOneInverseContext, Result> = {
		connect: NoResult,
		create: context => this.validateCreate(context),
	}
	oneHasOneOwning: CreateInputProcessor.HasOneRelationProcessor<Model.OneHasOneOwningContext, Result> = {
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
		return this.inputValidator.validateCreate({
			mapper: this.mapper,
			entity: context.targetEntity,
			data: context.input,
			path: newPath,
			overRelation: context.targetRelation,
		})
	}

	async column(context: Model.ColumnContext): Promise<Result> {
		return []
	}
}
