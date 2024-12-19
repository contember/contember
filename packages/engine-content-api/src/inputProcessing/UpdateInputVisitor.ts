import { Input, Model } from '@contember/schema'
import { filterObject } from '../utils'
import { UpdateInputProcessor } from './UpdateInputProcessor'
import { ImplementationException, UserError } from '../exception'
import { MapperInput } from '../mapper'

export class UpdateInputVisitor<Result> implements
	Model.ColumnVisitor<Promise<Result[]>>,
	Model.RelationByTypeVisitor<Promise<Result[]>> {

	constructor(
		private readonly updateInputProcessor: UpdateInputProcessor<Result>,
		private readonly schema: Model.Schema,
		private readonly data: MapperInput.UpdateDataInput,
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
			this.data[context.relation.name] as MapperInput.CreateManyRelationInput,
		)
	}

	public visitManyHasManyOwning(context: Model.ManyHasManyOwningContext) {
		return this.processManyRelationInput(
			this.updateInputProcessor.manyHasManyOwning,
			context,
			this.data[context.relation.name] as MapperInput.CreateManyRelationInput,
		)
	}

	public visitManyHasOne(context: Model.ManyHasOneContext) {
		return this.processRelationInput(
			this.updateInputProcessor.manyHasOne,
			context,
			this.data[context.relation.name] as MapperInput.CreateOneRelationInput,
		)
	}

	public visitOneHasMany(context: Model.OneHasManyContext) {
		return this.processManyRelationInput(
			this.updateInputProcessor.oneHasMany,
			context,
			this.data[context.relation.name] as MapperInput.CreateManyRelationInput,
		)
	}

	public visitOneHasOneInverse(context: Model.OneHasOneInverseContext) {
		return this.processRelationInput(
			this.updateInputProcessor.oneHasOneInverse,
			context,
			this.data[context.relation.name] as MapperInput.CreateOneRelationInput,
		)
	}

	public visitOneHasOneOwning(context: Model.OneHasOneOwningContext) {
		return this.processRelationInput(
			this.updateInputProcessor.oneHasOneOwning,
			context,
			this.data[context.relation.name] as MapperInput.CreateOneRelationInput,
		)
	}

	private async processRelationInput<Context>(
		processor: UpdateInputProcessor.HasOneRelationInputProcessor<Context, Result>,
		context: Context,
		input: MapperInput.UpdateOneRelationInput | undefined,
	): Promise< Result[]> {
		if (input === undefined || input === null) {
			return Promise.resolve([])
		}
		input = filterObject(input, (k, v) => v !== null && v !== undefined)
		this.verifyOperations(input)
		if ('connect' in input) {
			return [await processor.connect({ ...context, input: input.connect })]
		}
		if ('create' in input) {
			return [await processor.create({ ...context, input: input.create })]
		}
		if ('connectOrCreate' in input) {
			return [await processor.connectOrCreate({ ...context, input: input.connectOrCreate })]
		}
		if ('delete' in input) {
			return [await processor.delete({ ...context, input: undefined })]
		}
		if ('disconnect' in input) {
			return [await processor.disconnect({ ...context, input: undefined })]
		}
		if ('update' in input) {
			return [await processor.update({ ...context, input: input.update })]
		}
		if ('upsert' in input) {
			return [await processor.upsert({ ...context, input: input.upsert })]
		}
		throw new ImplementationException()
	}

	private async processManyRelationInput<Context>(
		processor: UpdateInputProcessor.HasManyRelationInputProcessor<Context, Result>,
		context: Context,
		input: MapperInput.UpdateManyRelationInput | undefined,
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
			if ('connect' in element) {
				result = processor.connect({ ...context, input: element.connect, index: i, alias })
			}
			if ('create' in element) {
				result = processor.create({ ...context, input: element.create, index: i, alias })
			}
			if ('connectOrCreate' in element) {
				result = processor.connectOrCreate({ ...context, input: element.connectOrCreate, index: i, alias })
			}
			if ('delete' in element) {
				result = processor.delete({ ...context, input: element.delete, index: i, alias })
			}
			if ('disconnect' in element) {
				result = processor.disconnect({ ...context, input: element.disconnect, index: i, alias })
			}
			if ('update' in element) {
				result = processor.update({
					...context,
					input: { where: element.update.by, data: element.update.data },
					index: i,
					alias,
				})
			}
			if ('upsert' in element) {
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
