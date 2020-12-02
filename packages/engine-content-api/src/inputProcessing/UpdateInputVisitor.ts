import { Input, Model } from '@contember/schema'
import { filterObject, isIt } from '../utils'
import { UpdateInputProcessor } from './UpdateInputProcessor'
import * as Context from './InputContext'
import { ImplementationException, UserError } from '../exception'

export class UpdateInputVisitor<Result>
	implements
		Model.ColumnVisitor<Promise<Result | Result[] | undefined>>,
		Model.RelationByTypeVisitor<Promise<Result | Result[] | undefined>> {
	constructor(
		private readonly updateInputProcessor: UpdateInputProcessor<Result>,
		private readonly schema: Model.Schema,
		private readonly data: Input.UpdateDataInput,
	) {}

	public visitColumn(entity: Model.Entity, column: Model.AnyColumn): Promise<Result> {
		return this.updateInputProcessor.column({
			entity,
			column,
			input: this.data[column.name] as Input.ColumnValue,
		})
	}

	public visitManyHasManyInverse(
		entity: Model.Entity,
		relation: Model.ManyHasManyInverseRelation,
		targetEntity: Model.Entity,
		targetRelation: Model.ManyHasManyOwnerRelation,
	) {
		return this.processManyRelationInput<Context.ManyHasManyInverseContext>(
			this.updateInputProcessor.manyHasManyInverse,
			{ entity, relation, targetEntity, targetRelation },
			this.data[relation.name] as Input.CreateManyRelationInput,
		)
	}

	public visitManyHasManyOwner(
		entity: Model.Entity,
		relation: Model.ManyHasManyOwnerRelation,
		targetEntity: Model.Entity,
		targetRelation: Model.ManyHasManyInverseRelation | null,
	) {
		return this.processManyRelationInput<Context.ManyHasManyOwnerContext>(
			this.updateInputProcessor.manyHasManyOwner,
			{ entity, relation, targetEntity, targetRelation },
			this.data[relation.name] as Input.CreateManyRelationInput,
		)
	}

	public visitManyHasOne(
		entity: Model.Entity,
		relation: Model.ManyHasOneRelation,
		targetEntity: Model.Entity,
		targetRelation: Model.OneHasManyRelation | null,
	) {
		return this.processRelationInput<Context.ManyHasOneContext>(
			this.updateInputProcessor.manyHasOne,
			{
				entity,
				relation,
				targetEntity,
				targetRelation,
			},
			this.data[relation.name] as Input.CreateOneRelationInput,
		)
	}

	public visitOneHasMany(
		entity: Model.Entity,
		relation: Model.OneHasManyRelation,
		targetEntity: Model.Entity,
		targetRelation: Model.ManyHasOneRelation,
	) {
		return this.processManyRelationInput<Context.OneHasManyContext>(
			this.updateInputProcessor.oneHasMany,
			{ entity, relation, targetEntity, targetRelation },
			this.data[relation.name] as Input.CreateManyRelationInput,
		)
	}

	public visitOneHasOneInverse(
		entity: Model.Entity,
		relation: Model.OneHasOneInverseRelation,
		targetEntity: Model.Entity,
		targetRelation: Model.OneHasOneOwnerRelation,
	) {
		return this.processRelationInput<Context.OneHasOneInverseContext>(
			this.updateInputProcessor.oneHasOneInverse,
			{
				entity,
				relation,
				targetEntity,
				targetRelation,
			},
			this.data[relation.name] as Input.CreateOneRelationInput,
		)
	}

	public visitOneHasOneOwner(
		entity: Model.Entity,
		relation: Model.OneHasOneOwnerRelation,
		targetEntity: Model.Entity,
		targetRelation: Model.OneHasOneInverseRelation | null,
	) {
		return this.processRelationInput<Context.OneHasOneOwnerContext>(
			this.updateInputProcessor.oneHasOneOwner,
			{
				entity,
				relation,
				targetEntity,
				targetRelation,
			},
			this.data[relation.name] as Input.CreateOneRelationInput,
		)
	}

	private processRelationInput<Context>(
		processor: UpdateInputProcessor.HasOneRelationInputProcessor<Context, Result>,
		context: Context,
		input: Input.UpdateOneRelationInput | undefined,
	): Promise<undefined | Result> {
		if (input === undefined || input === null) {
			return Promise.resolve(undefined)
		}
		input = filterObject(input, (k, v) => v !== null && v !== undefined)
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
		throw new ImplementationException()
	}

	private async processManyRelationInput<Context>(
		processor: UpdateInputProcessor.HasManyRelationInputProcessor<Context, Result>,
		context: Context,
		input: Input.UpdateManyRelationInput | undefined,
	): Promise<undefined | Result[]> {
		if (input === undefined || input === null) {
			return Promise.resolve(undefined)
		}
		const results: Array<Result> = []
		let i = 0
		for (let element of input) {
			const alias = element.alias
			element = filterObject(element, (k, v) => v !== null && v !== undefined)
			this.verifyOperations(element)
			let result
			if (isIt<Input.ConnectRelationInput>(element, 'connect')) {
				result = processor.connect({ ...context, input: element.connect, index: i, alias })
			}
			if (isIt<Input.CreateRelationInput>(element, 'create')) {
				result = processor.create({ ...context, input: element.create, index: i, alias })
			}
			if (isIt<Input.DeleteSpecifiedRelationInput>(element, 'delete')) {
				result = processor.delete({ ...context, input: element.delete, index: i, alias })
			}
			if (isIt<Input.DisconnectSpecifiedRelationInput>(element, 'disconnect')) {
				result = processor.disconnect({ ...context, input: element.disconnect, index: i, alias })
			}
			if (isIt<Input.UpdateSpecifiedRelationInput>(element, 'update')) {
				result = processor.update({
					...context,
					input: { where: element.update.by, data: element.update.data },
					index: i,
					alias,
				})
			}
			if (isIt<Input.UpsertSpecifiedRelationInput>(element, 'upsert')) {
				result = processor.upsert({
					...context,
					input: { where: element.upsert.by, update: element.upsert.update, create: element.upsert.create },
					index: i,
					alias,
				})
			}

			if (result !== undefined) {
				results.push(await result)
			}
		}
		return results
	}

	private verifyOperations(input: object) {
		const keys = Object.keys(input).filter(it => it !== 'alias')
		if (keys.length !== 1 || !['create', 'connect', 'delete', 'disconnect', 'update', 'upsert'].includes(keys[0])) {
			const found = keys.length === 0 ? 'none' : keys.join(', ')
			throw new UserError(
				`Expected exactly one of: "create", "connect", "delete", "disconnect", "update" or "upsert". ${found} found.`,
			)
		}
	}
}
