import { CreateInputProcessor } from '../../inputProcessing'
import { Input, Model } from '@contember/schema'
import { appendRelationToPath, ValidationPath } from '../ValidationPath'
import { Mapper, MapperInput } from '../../mapper'
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
		connectOrCreate: context => this.validateCreate({ ...context, input: context.input.create }),
	}

	manyHasManyOwning: CreateInputProcessor.HasManyRelationProcessor<Model.ManyHasManyOwningContext, Result> = {
		connect: NoResult,
		create: context => this.validateCreate(context),
		connectOrCreate: context => this.validateCreate({ ...context, input: context.input.create }),
	}

	manyHasOne: CreateInputProcessor.HasOneRelationProcessor<Model.ManyHasOneContext, Result> = {
		connect: NoResult,
		create: context => this.validateCreate(context),
		connectOrCreate: context => this.validateCreate({ ...context, input: context.input.create }),
	}

	oneHasMany: CreateInputProcessor.HasManyRelationProcessor<Model.OneHasManyContext, Result> = {
		connect: NoResult,
		create: context => this.validateCreate(context),
		connectOrCreate: context => this.validateCreate({ ...context, input: context.input.create }),
	}
	oneHasOneInverse: CreateInputProcessor.HasOneRelationProcessor<Model.OneHasOneInverseContext, Result> = {
		connect: NoResult,
		create: context => this.validateCreate(context),
		connectOrCreate: context => this.validateCreate({ ...context, input: context.input.create }),
	}
	oneHasOneOwning: CreateInputProcessor.HasOneRelationProcessor<Model.OneHasOneOwningContext, Result> = {
		connect: NoResult,
		create: context => this.validateCreate(context),
		connectOrCreate: context => this.validateCreate({ ...context, input: context.input.create }),
	}

	async validateCreate(context: {
		targetEntity: Model.Entity
		relation: Model.AnyRelation
		input: MapperInput.CreateDataInput
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
