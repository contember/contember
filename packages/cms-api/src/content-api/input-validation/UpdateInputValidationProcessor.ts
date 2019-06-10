import UpdateInputProcessor from '../inputProcessing/UpdateInputProcessor'
import * as Context from '../inputProcessing/InputContext'
import { Input, Model, Value } from 'cms-common'
import InputValidator from './InputValidator'
import ValidationDataSelector from './ValidationDataSelector'

type Result = any

const NoResult = () => Promise.resolve([])

export default class UpdateInputValidationProcessor implements UpdateInputProcessor<Result> {
	constructor(
		private readonly inputValidator: InputValidator,
		private readonly path: (string | number)[],
		private readonly node: Value.Object,
		private readonly dataSelector: ValidationDataSelector
	) {}

	async column(context: Context.ColumnContext): Promise<Result> {
		return []
	}

	manyHasManyInversed: UpdateInputProcessor.HasManyRelationInputProcessor<
		Context.ManyHasManyInversedContext,
		Result
	> = {
		create: ctx => this.processCreate(ctx),
		update: ctx => this.processManyManyUpdate(ctx),
		upsert: ctx => this.processManyManyUpsert(ctx),
		connect: NoResult,
		disconnect: NoResult,
		['delete']: NoResult,
	}
	manyHasManyOwner: UpdateInputProcessor.HasManyRelationInputProcessor<Context.ManyHasManyOwnerContext, Result> = {
		create: ctx => this.processCreate(ctx),
		update: ctx => this.processManyManyUpdate(ctx),
		upsert: ctx => this.processManyManyUpsert(ctx),
		connect: NoResult,
		disconnect: NoResult,
		['delete']: NoResult,
	}
	manyHasOne: UpdateInputProcessor.HasOneRelationInputProcessor<Context.ManyHasOneContext, Result> = {
		create: ctx => this.processCreate(ctx),
		update: ctx => this.processHasOneUpdate(ctx),
		upsert: ctx => this.processHasOneUpsert(ctx),
		connect: NoResult,
		disconnect: NoResult,
		['delete']: NoResult,
	}
	oneHasMany: UpdateInputProcessor.HasManyRelationInputProcessor<Context.OneHasManyContext, Result> = {
		create: ctx => this.processCreate(ctx),
		update: ctx => this.processOneManyUpdate(ctx),
		upsert: async () => {
			return []
		},
		connect: NoResult,
		disconnect: NoResult,
		['delete']: NoResult,
	}
	oneHasOneInversed: UpdateInputProcessor.HasOneRelationInputProcessor<Context.OneHasOneInversedContext, Result> = {
		create: ctx => this.processCreate(ctx),
		update: ctx => this.processHasOneUpdate(ctx),
		upsert: ctx => this.processHasOneUpsert(ctx),
		connect: NoResult,
		disconnect: NoResult,
		['delete']: NoResult,
	}

	oneHasOneOwner: UpdateInputProcessor.HasOneRelationInputProcessor<Context.OneHasOneOwnerContext, Result> = {
		create: ctx => this.processCreate(ctx),
		update: ctx => this.processHasOneUpdate(ctx),
		upsert: ctx => this.processHasOneUpsert(ctx),
		connect: NoResult,
		disconnect: NoResult,
		['delete']: NoResult,
	}

	async processCreate(context: {
		targetEntity: Model.Entity
		relation: Model.AnyRelation
		input: Input.CreateDataInput
		index?: number
	}) {
		const newPath = [...this.path, ...(context.index ? [context.index] : []), context.relation.name]
		return this.inputValidator.validateCreate(context.targetEntity, context.input, newPath)
	}

	async processHasOneUpdate(context: {
		targetEntity: Model.Entity
		relation: Model.AnyRelation
		input: Input.UpdateDataInput
		targetRelation: Model.AnyRelation | null
	}) {
		const newPath = [...this.path, context.relation.name]
		const relationNode = this.node[context.relation.name]
		if (!relationNode) {
			return []
		}
		const primary = (relationNode as Value.Object)[context.targetEntity.primary] as Value.PrimaryValue
		const where = {
			[context.targetEntity.primary]: primary,
		}
		return this.inputValidator.validateUpdate(context.targetEntity, where, context.input, newPath)
	}

	async processHasOneUpsert(context: {
		targetEntity: Model.Entity
		relation: Model.AnyRelation
		input: UpdateInputProcessor.UpsertInput
	}) {
		const newPath = [...this.path, context.relation.name]
		const relNode = this.node[context.relation.name] as Value.Object | undefined
		if (!relNode) {
			return this.inputValidator.validateCreate(context.targetEntity, context.input.create, newPath)
		}
		const primary = relNode[context.targetEntity.primary] as Value.PrimaryValue
		const where = {
			[context.targetEntity.primary]: primary,
		}
		return this.inputValidator.validateUpdate(context.targetEntity, where, context.input.update, newPath)
	}

	async processManyManyUpdate(context: {
		targetEntity: Model.Entity
		relation: Model.AnyRelation
		input: UpdateInputProcessor.UpdateManyInput
		index: number
	}) {
		const newPath = [...this.path, context.index, context.relation.name]
		return this.inputValidator.validateUpdate(context.targetEntity, context.input.where, context.input.data, newPath)
	}

	async processManyManyUpsert(context: {
		targetEntity: Model.Entity
		relation: Model.AnyRelation
		input: UpdateInputProcessor.UpsertManyInput
		index: number
	}) {
		const id = await this.dataSelector.getPrimaryValue(context.targetEntity, context.input.where)
		const newPath = [...this.path, context.index, context.relation.name]
		if (id) {
			return this.inputValidator.validateUpdate(
				context.targetEntity,
				{ [context.targetEntity.primary]: id },
				context.input.update,
				newPath
			)
		}
		return this.inputValidator.validateCreate(context.targetEntity, context.input.create, newPath)
	}

	async processOneManyUpdate(context: {
		targetEntity: Model.Entity
		entity: Model.Entity
		relation: Model.AnyRelation
		targetRelation: Model.AnyRelation
		input: UpdateInputProcessor.UpdateManyInput
		index: number
	}) {
		const newPath = [...this.path, context.index, context.relation.name]
		const fullWhere = {
			...context.input.where,
			[context.targetRelation.name]: {
				[context.entity.primary]: this.node[context.entity.primary] as Value.PrimaryValue,
			},
		}
		return this.inputValidator.validateUpdate(context.targetEntity, fullWhere, context.input.data, newPath)
	}

	processOneManyUpsert = async (context: {
		targetEntity: Model.Entity
		entity: Model.Entity
		relation: Model.AnyRelation
		targetRelation: Model.AnyRelation
		input: UpdateInputProcessor.UpsertManyInput
		index: number
	}) => {
		const fullWhere = {
			...context.input.where,
			[context.targetRelation.name]: {
				[context.entity.primary]: this.node[context.entity.primary] as Value.PrimaryValue,
			},
		}
		const id = await this.dataSelector.getPrimaryValue(context.targetEntity, fullWhere)
		const newPath = [...this.path, context.index, context.relation.name]
		if (id) {
			return this.inputValidator.validateUpdate(
				context.targetEntity,
				{ [context.targetEntity.primary]: id },
				context.input.update,
				newPath
			)
		}
		return this.inputValidator.validateCreate(context.targetEntity, context.input.create, newPath)
	}
}
