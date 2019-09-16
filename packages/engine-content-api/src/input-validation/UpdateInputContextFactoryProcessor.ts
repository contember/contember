import UpdateInputProcessor from '../inputProcessing/UpdateInputProcessor'
import * as Context from '../inputProcessing/InputContext'
import { Input, Model, Value } from '@contember/schema'
import ValidationContextFactory from './ValidationContextFactory'
import DependencyCollector from './DependencyCollector'
import ValidationDataSelector from './ValidationDataSelector'
import Mapper from '../sql/Mapper'

type Result = any

export default class UpdateInputValidationProcessor implements UpdateInputProcessor<Result> {
	constructor(
		private node: Value.Object,
		private readonly validationContextFactory: ValidationContextFactory,
		private readonly dependencies: DependencyCollector.Dependencies,
		private readonly dataSelector: ValidationDataSelector,
		private readonly mapper: Mapper,
	) {}

	async column(context: Context.ColumnContext): Promise<Result> {
		if (context.input !== undefined) {
			this.node[context.column.name] = context.input
		}
	}

	manyHasManyInversed: UpdateInputProcessor.HasManyRelationInputProcessor<
		Context.ManyHasManyInversedContext,
		Result
	> = {
		create: context => this.processHasManyCreate(context),
		update: context => this.processHasManyUpdate(context),
		upsert: context => this.processHasManyUpsert(context),
		connect: context => this.processHasManyConnect(context),
		disconnect: context => this.processHasManyDeleteOrDisconnect(context),
		['delete']: context => this.processHasManyDeleteOrDisconnect(context),
	}

	manyHasManyOwner: UpdateInputProcessor.HasManyRelationInputProcessor<Context.ManyHasManyOwnerContext, Result> = {
		create: context => this.processHasManyCreate(context),
		update: context => this.processHasManyUpdate(context),
		upsert: context => this.processHasManyUpsert(context),
		connect: context => this.processHasManyConnect(context),
		disconnect: context => this.processHasManyDeleteOrDisconnect(context),
		['delete']: context => this.processHasManyDeleteOrDisconnect(context),
	}
	manyHasOne: UpdateInputProcessor.HasOneRelationInputProcessor<Context.ManyHasOneContext, Result> = {
		create: context => this.processHasOneCreate(context),
		update: context => this.processHasOneUpdate(context),
		upsert: context => this.processHasOneUpsert(context),
		connect: context => this.processHasOneConnect(context),
		disconnect: context => this.processHasOneDeleteOrDisconnect(context),
		['delete']: context => this.processHasOneDeleteOrDisconnect(context),
	}
	oneHasMany: UpdateInputProcessor.HasManyRelationInputProcessor<Context.OneHasManyContext, Result> = {
		create: context => this.processHasManyCreate(context),
		update: context => this.processHasManyUpdate(context),
		upsert: context => this.processHasManyUpsert(context),
		connect: context => this.processHasManyConnect(context),
		disconnect: context => this.processHasManyDeleteOrDisconnect(context),
		['delete']: context => this.processHasManyDeleteOrDisconnect(context),
	}
	oneHasOneInversed: UpdateInputProcessor.HasOneRelationInputProcessor<Context.OneHasOneInversedContext, Result> = {
		create: context => this.processHasOneCreate(context),
		update: context => this.processHasOneUpdate(context),
		upsert: context => this.processHasOneUpsert(context),
		connect: context => this.processHasOneConnect(context),
		disconnect: context => this.processHasOneDeleteOrDisconnect(context),
		['delete']: context => this.processHasOneDeleteOrDisconnect(context),
	}
	oneHasOneOwner: UpdateInputProcessor.HasOneRelationInputProcessor<Context.OneHasOneOwnerContext, Result> = {
		create: context => this.processHasOneCreate(context),
		update: context => this.processHasOneUpdate(context),
		upsert: context => this.processHasOneUpsert(context),
		connect: context => this.processHasOneConnect(context),
		disconnect: context => this.processHasOneDeleteOrDisconnect(context),
		['delete']: context => this.processHasOneDeleteOrDisconnect(context),
	}

	async processHasOneConnect(context: {
		targetEntity: Model.Entity
		relation: Model.AnyRelation
		input: Input.UniqueWhere
	}) {
		this.node[context.relation.name] = await this.dataSelector.select(
			this.mapper,
			context.targetEntity,
			context.input,
			this.dependencies[context.relation.name],
		)
	}

	async processHasOneCreate(context: {
		targetEntity: Model.Entity
		relation: Model.AnyRelation
		input: Input.CreateDataInput
	}) {
		this.node[context.relation.name] = await this.validationContextFactory.createForCreate(
			this.mapper,
			context.targetEntity,
			context.input,
			this.dependencies[context.relation.name],
		)
	}

	async processHasOneUpdate(context: {
		targetEntity: Model.Entity
		relation: Model.AnyRelation
		input: Input.UpdateDataInput
	}) {
		if (!this.node[context.relation.name]) {
			return
		}
		this.node[context.relation.name] = (await this.validationContextFactory.createForUpdate(
			this.mapper,
			context.targetEntity,
			{ node: this.node[context.relation.name] as Value.Object },
			context.input,
			this.dependencies[context.relation.name],
		))!
	}

	async processHasOneUpsert(context: {
		targetEntity: Model.Entity
		relation: Model.AnyRelation
		input: UpdateInputProcessor.UpsertInput
	}) {
		if (this.node[context.relation.name]) {
			this.processHasOneUpdate({ ...context, input: context.input.update })
		} else {
			this.processHasOneCreate({ ...context, input: context.input.create })
		}
	}

	async processHasOneDeleteOrDisconnect(context: { relation: Model.AnyRelation }) {
		delete this.node[context.relation.name]
	}

	async processHasManyConnect(context: {
		targetEntity: Model.Entity
		relation: Model.AnyRelation
		input: Input.UniqueWhere
	}) {
		const item = await this.dataSelector.select(
			this.mapper,
			context.targetEntity,
			context.input,
			this.dependencies[context.relation.name],
		)
		if (!item) {
			return
		}
		const id = item[context.targetEntity.primary]
		;(this.node[context.relation.name] as Value.List) = [
			...(this.node[context.relation.name] as Value.List).filter((it: any) => it[context.targetEntity.primary] !== id),
			item,
		]
	}

	async processHasManyCreate(context: {
		targetEntity: Model.Entity
		relation: Model.AnyRelation
		input: Input.CreateDataInput
	}): Promise<void> {
		const nestedCreateContext = await this.validationContextFactory.createForCreate(
			this.mapper,
			context.targetEntity,
			context.input,
			this.dependencies[context.relation.name],
		)
		;(this.node[context.relation.name] as Value.List).push(nestedCreateContext)
	}

	async processHasManyUpdate(context: {
		targetEntity: Model.Entity
		relation: Model.AnyRelation
		input: UpdateInputProcessor.UpdateManyInput
	}): Promise<void> {
		const id = await this.dataSelector.getPrimaryValue(this.mapper, context.targetEntity, context.input.where)
		if (!id) {
			return
		}
		this.doProcessHasManyUpdate({ ...context, input: context.input.data, id })
	}

	async processHasManyUpsert(context: {
		targetEntity: Model.Entity
		relation: Model.AnyRelation
		input: UpdateInputProcessor.UpsertManyInput
	}): Promise<void> {
		const id = await this.dataSelector.getPrimaryValue(this.mapper, context.targetEntity, context.input.where)
		if (id) {
			this.doProcessHasManyUpdate({ ...context, input: context.input.update, id })
		} else {
			this.processHasManyCreate({ ...context, input: context.input.create })
		}
	}

	async doProcessHasManyUpdate(context: {
		id: Value.PrimaryValue
		targetEntity: Model.Entity
		relation: Model.AnyRelation
		input: Input.UpdateDataInput
	}) {
		const nestedUpdateContext = await this.validationContextFactory.createForUpdate(
			this.mapper,
			context.targetEntity,
			{ where: { [context.targetEntity.primary]: context.id! } },
			context.input,
			this.dependencies[context.relation.name],
		)
		if (!nestedUpdateContext) {
			return
		}
		this.node[context.relation.name] = [
			...(this.node[context.relation.name] as Value.List).filter(
				(it: any) => it[context.targetEntity.primary] !== context.id,
			),
			nestedUpdateContext,
		]
	}

	async processHasManyDeleteOrDisconnect(context: {
		targetEntity: Model.Entity
		relation: Model.AnyRelation
		input: Input.UniqueWhere
	}): Promise<void> {
		const id = await this.dataSelector.getPrimaryValue(this.mapper, context.targetEntity, context.input)
		this.node[context.relation.name] = (this.node[context.relation.name] as Value.List).filter(
			(it: any) => it[context.targetEntity.primary] !== id,
		)
	}
}
