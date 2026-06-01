import { UpdateInputProcessor } from '../../inputProcessing/index.js'
import { Input, Model } from '@contember/schema'
import { appendRelationToPath, ValidationPath } from '../ValidationPath.js'
import { Mapper, MapperInput } from '../../mapper/index.js'
import { InputPreValidator } from './InputPreValidator.js'

type Result = any

const NoResult = () => Promise.resolve([])

export class UpdateInputPreValidationProcessor implements UpdateInputProcessor<Result> {
	constructor(
		private readonly inputValidator: InputPreValidator,
		private readonly path: ValidationPath,
		private readonly mapper: Mapper,
	) {}

	async column(context: Model.ColumnContext): Promise<Result> {
		return []
	}

	manyHasManyInverse: UpdateInputProcessor.HasManyRelationInputProcessor<Model.ManyHasManyInverseContext, Result> = {
		create: ctx => this.processCreate(ctx),
		update: ctx => this.processUpdate({ ...ctx, input: ctx.input.data }),
		upsert: ctx => this.processUpsert(ctx),
		connectOrCreate: ctx => this.processCreate({ ...ctx, input: ctx.input.create }),
		connect: NoResult,
		disconnect: NoResult,
		['delete']: NoResult,
		set: ctx => this.processSet(ctx),
	}
	manyHasManyOwning: UpdateInputProcessor.HasManyRelationInputProcessor<Model.ManyHasManyOwningContext, Result> = {
		create: ctx => this.processCreate(ctx),
		update: ctx => this.processUpdate({ ...ctx, input: ctx.input.data }),
		upsert: ctx => this.processUpsert(ctx),
		connectOrCreate: ctx => this.processCreate({ ...ctx, input: ctx.input.create }),
		connect: NoResult,
		disconnect: NoResult,
		['delete']: NoResult,
		set: ctx => this.processSet(ctx),
	}
	manyHasOne: UpdateInputProcessor.HasOneRelationInputProcessor<Model.ManyHasOneContext, Result> = {
		create: ctx => this.processCreate(ctx),
		update: ctx => this.processUpdate(ctx),
		upsert: ctx => this.processUpsert(ctx),
		connectOrCreate: ctx => this.processCreate({ ...ctx, input: ctx.input.create }),
		connect: NoResult,
		disconnect: NoResult,
		['delete']: NoResult,
	}
	oneHasMany: UpdateInputProcessor.HasManyRelationInputProcessor<Model.OneHasManyContext, Result> = {
		create: ctx => this.processCreate(ctx),
		update: ctx => this.processUpdate({ ...ctx, input: ctx.input.data }),
		upsert: ctx => this.processUpsert(ctx),
		connectOrCreate: ctx => this.processCreate({ ...ctx, input: ctx.input.create }),
		connect: NoResult,
		disconnect: NoResult,
		['delete']: NoResult,
		set: ctx => this.processSet(ctx),
	}
	oneHasOneInverse: UpdateInputProcessor.HasOneRelationInputProcessor<Model.OneHasOneInverseContext, Result> = {
		create: ctx => this.processCreate(ctx),
		update: ctx => this.processUpdate(ctx),
		upsert: ctx => this.processUpsert(ctx),
		connectOrCreate: ctx => this.processCreate({ ...ctx, input: ctx.input.create }),
		connect: NoResult,
		disconnect: NoResult,
		['delete']: NoResult,
	}

	oneHasOneOwning: UpdateInputProcessor.HasOneRelationInputProcessor<Model.OneHasOneOwningContext, Result> = {
		create: ctx => this.processCreate(ctx),
		update: ctx => this.processUpdate(ctx),
		upsert: ctx => this.processUpsert(ctx),
		connectOrCreate: ctx => this.processCreate({ ...ctx, input: ctx.input.create }),
		connect: NoResult,
		disconnect: NoResult,
		['delete']: NoResult,
	}

	async processCreate(context: {
		targetEntity: Model.Entity
		relation: Model.AnyRelation
		targetRelation: Model.AnyRelation | null
		input: MapperInput.CreateDataInput
		index?: number
		alias?: string
	}) {
		const newPath = appendRelationToPath(this.path, context.relation.name, context)

		return this.inputValidator.validateCreate({
			entity: context.targetEntity,
			mapper: this.mapper,
			data: context.input,
			path: newPath,
			overRelation: context.targetRelation,
		})
	}

	async processUpsert(context: {
		targetEntity: Model.Entity
		targetRelation: Model.AnyRelation | null
		relation: Model.AnyRelation
		input: UpdateInputProcessor.UpsertInput
		index?: number
		alias?: string
	}) {
		const newPath = appendRelationToPath(this.path, context.relation.name, context)
		return [
			...(await this.inputValidator.validateUpdate({
				entity: context.targetEntity,
				mapper: this.mapper,
				data: context.input.update,
				path: newPath,
				where: {}, // todo
			})),
			...(await this.inputValidator.validateCreate({
				entity: context.targetEntity,
				mapper: this.mapper,
				data: context.input.create,
				path: newPath,
				overRelation: context.targetRelation,
			})),
		]
	}

	async processSet(context: {
		targetEntity: Model.Entity
		relation: Model.AnyRelation
		targetRelation: Model.AnyRelation | null
		input: UpdateInputProcessor.SetManyInput
	}) {
		const results: Result[] = []
		for (const item of context.input.items) {
			if ('create' in item) {
				results.push(...(await this.processCreate({ ...context, input: item.create })))
			} else if ('connectOrCreate' in item) {
				results.push(...(await this.processCreate({ ...context, input: item.connectOrCreate.create })))
			} else if ('update' in item) {
				results.push(...(await this.processUpdate({ ...context, input: item.update.data })))
			} else if ('upsert' in item) {
				results.push(...(await this.processUpsert({ ...context, input: { update: item.upsert.update, create: item.upsert.create } })))
			}
		}
		return results
	}

	async processUpdate(context: {
		targetEntity: Model.Entity
		relation: Model.AnyRelation
		input: MapperInput.UpdateDataInput
		targetRelation: Model.AnyRelation | null
		index?: number
		alias?: string
	}) {
		const newPath = appendRelationToPath(this.path, context.relation.name, context)
		return this.inputValidator.validateUpdate({
			entity: context.targetEntity,
			mapper: this.mapper,
			data: context.input,
			path: newPath,
			where: {}, // todo,
		})
	}
}
