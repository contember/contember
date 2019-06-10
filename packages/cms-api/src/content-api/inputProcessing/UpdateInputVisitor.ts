import { Input, Model } from 'cms-common'
import { isIt } from '../../utils/type'
import UpdateInputProcessor from './UpdateInputProcessor'
import * as Context from './InputContext'

export default class UpdateInputVisitor<Result>
	implements
		Model.ColumnVisitor<Promise<Result | Result[] | undefined>>,
		Model.RelationByTypeVisitor<Promise<Result | Result[] | undefined>> {
	constructor(
		private readonly updateInputProcessor: UpdateInputProcessor<Result>,
		private readonly schema: Model.Schema,
		private readonly data: Input.UpdateDataInput
	) {}

	public visitColumn(entity: Model.Entity, column: Model.AnyColumn): Promise<Result> {
		return this.updateInputProcessor.column({
			entity,
			column,
			input: this.data[column.name] as Input.ColumnValue,
		})
	}

	public visitManyHasManyInversed(
		entity: Model.Entity,
		relation: Model.ManyHasManyInversedRelation,
		targetEntity: Model.Entity,
		targetRelation: Model.ManyHasManyOwnerRelation
	) {
		return this.processManyRelationInput<Context.ManyHasManyInversedContext>(
			this.updateInputProcessor.manyHasManyInversed,
			{ entity, relation, targetEntity, targetRelation },
			this.data[relation.name] as Input.CreateManyRelationInput
		)
	}

	public visitManyHasManyOwner(
		entity: Model.Entity,
		relation: Model.ManyHasManyOwnerRelation,
		targetEntity: Model.Entity,
		targetRelation: Model.ManyHasManyInversedRelation | null
	) {
		return this.processManyRelationInput<Context.ManyHasManyOwnerContext>(
			this.updateInputProcessor.manyHasManyOwner,
			{ entity, relation, targetEntity, targetRelation },
			this.data[relation.name] as Input.CreateManyRelationInput
		)
	}

	public visitManyHasOne(
		entity: Model.Entity,
		relation: Model.ManyHasOneRelation,
		targetEntity: Model.Entity,
		targetRelation: Model.OneHasManyRelation | null
	) {
		return this.processRelationInput<Context.ManyHasOneContext>(
			this.updateInputProcessor.manyHasOne,
			{
				entity,
				relation,
				targetEntity,
				targetRelation,
			},
			this.data[relation.name] as Input.CreateOneRelationInput
		)
	}

	public visitOneHasMany(
		entity: Model.Entity,
		relation: Model.OneHasManyRelation,
		targetEntity: Model.Entity,
		targetRelation: Model.ManyHasOneRelation
	) {
		return this.processManyRelationInput<Context.OneHasManyContext>(
			this.updateInputProcessor.oneHasMany,
			{ entity, relation, targetEntity, targetRelation },
			this.data[relation.name] as Input.CreateManyRelationInput
		)
	}

	public visitOneHasOneInversed(
		entity: Model.Entity,
		relation: Model.OneHasOneInversedRelation,
		targetEntity: Model.Entity,
		targetRelation: Model.OneHasOneOwnerRelation
	) {
		return this.processRelationInput<Context.OneHasOneInversedContext>(
			this.updateInputProcessor.oneHasOneInversed,
			{
				entity,
				relation,
				targetEntity,
				targetRelation,
			},
			this.data[relation.name] as Input.CreateOneRelationInput
		)
	}

	public visitOneHasOneOwner(
		entity: Model.Entity,
		relation: Model.OneHasOneOwnerRelation,
		targetEntity: Model.Entity,
		targetRelation: Model.OneHasOneInversedRelation | null
	) {
		return this.processRelationInput<Context.OneHasOneOwnerContext>(
			this.updateInputProcessor.oneHasOneOwner,
			{
				entity,
				relation,
				targetEntity,
				targetRelation,
			},
			this.data[relation.name] as Input.CreateOneRelationInput
		)
	}

	private processRelationInput<Context>(
		processor: UpdateInputProcessor.HasOneRelationInputProcessor<Context, Result>,
		context: Context,
		input: Input.UpdateOneRelationInput | undefined
	): Promise<undefined | Result> {
		if (input === undefined || input === null) {
			return Promise.resolve(undefined)
		}
		this.verifyOperations(input)
		if (isIt<Input.ConnectRelationInput>(input, 'connect')) {
			return processor.connect({ ...context, input: input.connect })
		}
		if (isIt<Input.CreateRelationInput>(input, 'create')) {
			return processor.create({ ...context, input: input.create })
		}
		if (isIt<Input.DeleteRelationInput>(input, 'delete')) {
			return processor.delete({ ...context, input: undefined })
		}
		if (isIt<Input.DisconnectRelationInput>(input, 'disconnect')) {
			return processor.disconnect({ ...context, input: undefined })
		}
		if (isIt<Input.UpdateRelationInput>(input, 'update')) {
			return processor.update({ ...context, input: input.update })
		}
		if (isIt<Input.UpsertRelationInput>(input, 'upsert')) {
			return processor.upsert({ ...context, input: input.upsert })
		}
		throw new Error()
	}

	private processManyRelationInput<Context>(
		processor: UpdateInputProcessor.HasManyRelationInputProcessor<Context, Result>,
		context: Context,
		input: Input.UpdateManyRelationInput | undefined
	): Promise<undefined | Result[]> {
		if (input === undefined || input === null) {
			return Promise.resolve(undefined)
		}
		const promises: Array<Promise<Result>> = []
		let i = 0
		for (const element of input) {
			this.verifyOperations(element)
			let result
			if (isIt<Input.ConnectRelationInput>(element, 'connect')) {
				result = processor.connect({ ...context, input: element.connect, index: i })
			}
			if (isIt<Input.CreateRelationInput>(element, 'create')) {
				result = processor.create({ ...context, input: element.create, index: i })
			}
			if (isIt<Input.DeleteSpecifiedRelationInput>(element, 'delete')) {
				result = processor.delete({ ...context, input: element.delete, index: i })
			}
			if (isIt<Input.DisconnectSpecifiedRelationInput>(element, 'disconnect')) {
				result = processor.disconnect({ ...context, input: element.disconnect, index: i })
			}
			if (isIt<Input.UpdateSpecifiedRelationInput>(element, 'update')) {
				result = processor.update({
					...context,
					input: { where: element.update.by, data: element.update.data },
					index: i,
				})
			}
			if (isIt<Input.UpsertSpecifiedRelationInput>(element, 'upsert')) {
				result = processor.upsert({
					...context,
					input: { where: element.upsert.by, update: element.upsert.update, create: element.upsert.create },
					index: i,
				})
			}

			if (result !== undefined) {
				promises.push(result)
			}
		}
		return Promise.all(promises)
	}

	private verifyOperations(input: any) {
		const keys = Object.keys(input)
		if (keys.length !== 1) {
			const found = keys.length === 0 ? 'none' : keys.join(', ')
			throw new Error(
				`Expected exactly one of: "create", "connect", "delete", "disconnect", "update" or "upsert". ${found} found.`
			)
		}
	}
}
