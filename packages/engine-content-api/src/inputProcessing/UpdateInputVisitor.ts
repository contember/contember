import { Input, Model } from '@contember/schema'
import { filterObject, isIt } from '../utils'
import { UpdateInputProcessor } from './UpdateInputProcessor'
import { ImplementationException, UserError } from '../exception'

export class UpdateInputVisitor<Result> implements
	Model.ColumnVisitor<Promise<Result[]>>,
	Model.RelationByTypeVisitor<Promise<Result[]>> {

	constructor(
		private readonly updateInputProcessor: UpdateInputProcessor<Result>,
		private readonly schema: Model.Schema,
		private readonly data: Input.UpdateDataInput,
	) {}

	public async visitColumn({ entity, column }: Model.ColumnContext): Promise<Result[]> {
		return [await this.updateInputProcessor.column({
			entity,
			column,
			input: this.data[column.name] as Input.ColumnValue,
		})]
	}

	public visitManyHasManyInverse(context: Model.ManyHasManyInverseContext) {
		return this.processManyRelationInput(
			this.updateInputProcessor.manyHasManyInverse,
			context,
			this.data[context.relation.name] as Input.CreateManyRelationInput,
		)
	}

	public visitManyHasManyOwning(context: Model.ManyHasManyOwningContext) {
		return this.processManyRelationInput(
			this.updateInputProcessor.manyHasManyOwning,
			context,
			this.data[context.relation.name] as Input.CreateManyRelationInput,
		)
	}

	public visitManyHasOne(context: Model.ManyHasOneContext) {
		return this.processRelationInput(
			this.updateInputProcessor.manyHasOne,
			context,
			this.data[context.relation.name] as Input.CreateOneRelationInput,
		)
	}

	public visitOneHasMany(context: Model.OneHasManyContext) {
		return this.processManyRelationInput(
			this.updateInputProcessor.oneHasMany,
			context,
			this.data[context.relation.name] as Input.CreateManyRelationInput,
		)
	}

	public visitOneHasOneInverse(context: Model.OneHasOneInverseContext) {
		return this.processRelationInput(
			this.updateInputProcessor.oneHasOneInverse,
			context,
			this.data[context.relation.name] as Input.CreateOneRelationInput,
		)
	}

	public visitOneHasOneOwning(context: Model.OneHasOneOwningContext) {
		return this.processRelationInput(
			this.updateInputProcessor.oneHasOneOwning,
			context,
			this.data[context.relation.name] as Input.CreateOneRelationInput,
		)
	}

	private async processRelationInput<Context>(
		processor: UpdateInputProcessor.HasOneRelationInputProcessor<Context, Result>,
		context: Context,
		input: Input.UpdateOneRelationInput | undefined,
	): Promise< Result[]> {
		if (input === undefined || input === null) {
			return Promise.resolve([])
		}
		input = filterObject(input, (k, v) => v !== null && v !== undefined)
		this.verifyOperations(input)
		if (isIt<Input.ConnectRelationInput>(input, 'connect')) {
			return [await processor.connect({ ...context, input: input.connect })]
		}
		if (isIt<Input.CreateRelationInput>(input, 'create')) {
			return [await processor.create({ ...context, input: input.create })]
		}
		if (isIt<Input.ConnectOrCreateRelationInput>(input, 'connectOrCreate')) {
			return [await processor.connectOrCreate({ ...context, input: input.connectOrCreate })]
		}
		if (isIt<Input.DeleteRelationInput>(input, 'delete')) {
			return [await processor.delete({ ...context, input: undefined })]
		}
		if (isIt<Input.DisconnectRelationInput>(input, 'disconnect')) {
			return [await processor.disconnect({ ...context, input: undefined })]
		}
		if (isIt<Input.UpdateRelationInput>(input, 'update')) {
			return [await processor.update({ ...context, input: input.update })]
		}
		if (isIt<Input.UpsertRelationInput>(input, 'upsert')) {
			return [await processor.upsert({ ...context, input: input.upsert })]
		}
		throw new ImplementationException()
	}

	private async processManyRelationInput<Context>(
		processor: UpdateInputProcessor.HasManyRelationInputProcessor<Context, Result>,
		context: Context,
		input: Input.UpdateManyRelationInput | undefined,
	): Promise<Result[]> {
		if (input === undefined || input === null) {
			return Promise.resolve([])
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
			if (isIt<Input.ConnectOrCreateRelationInput>(element, 'connectOrCreate')) {
				result = processor.connectOrCreate({ ...context, input: element.connectOrCreate, index: i, alias })
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
		const ops = Object.values(Input.UpdateRelationOperation) as string[]
		if (keys.length !== 1 || !ops.includes(keys[0])) {
			const found = keys.length === 0 ? 'none' : keys.join(', ')
			throw new UserError(
				`Expected exactly one of: ${ops.join(', ')}. ${found} found.`,
			)
		}
	}
}
