import { filterObject } from '../utils'
import { Input, Model } from '@contember/schema'
import { CreateInputProcessor } from './CreateInputProcessor'
import { ImplementationException, UserError } from '../exception'
import { MapperInput } from '../mapper'

export class CreateInputVisitor<Result> implements
	Model.ColumnVisitor<Promise<Result[]>>,
	Model.RelationByTypeVisitor<Promise<Result[]>> {

	constructor(
		private readonly createInputProcessor: CreateInputProcessor<Result>,
		private readonly schema: Model.Schema,
		private readonly data: MapperInput.CreateDataInput,
	) {}

	public async visitColumn(context: Model.ColumnContext): Promise<Result[]> {
		return [await this.createInputProcessor.column({
			...context,
			input: this.data[context.column.name] as Input.ColumnValue,
		})]
	}

	public visitManyHasManyInverse(context: Model.ManyHasManyInverseContext) {
		return this.processManyRelationInput(
			this.createInputProcessor.manyHasManyInverse,
			context,
			this.data[context.relation.name] as MapperInput.CreateManyRelationInput,
		)
	}

	public visitManyHasManyOwning(context: Model.ManyHasManyOwningContext) {
		return this.processManyRelationInput(
			this.createInputProcessor.manyHasManyOwning,
			context,
			this.data[context.relation.name] as MapperInput.CreateManyRelationInput,
		)
	}

	public visitManyHasOne(context: Model.ManyHasOneContext) {
		return this.processRelationInput(
			this.createInputProcessor.manyHasOne,
			context,
			this.data[context.relation.name] as MapperInput.CreateOneRelationInput,
		)
	}

	public visitOneHasMany(context: Model.OneHasManyContext) {
		return this.processManyRelationInput(
			this.createInputProcessor.oneHasMany,
			context,
			this.data[context.relation.name] as MapperInput.CreateManyRelationInput,
		)
	}

	public visitOneHasOneInverse(context: Model.OneHasOneInverseContext) {
		return this.processRelationInput(
			this.createInputProcessor.oneHasOneInverse,
			context,
			this.data[context.relation.name] as MapperInput.CreateOneRelationInput,
		)
	}

	public visitOneHasOneOwning(context: Model.OneHasOneOwningContext) {
		return this.processRelationInput(
			this.createInputProcessor.oneHasOneOwning,
			context,
			this.data[context.relation.name] as MapperInput.CreateOneRelationInput,
		)
	}

	private async processRelationInput<Context>(
		processor: CreateInputProcessor.HasOneRelationProcessor<Context, Result>,
		context: Context,
		input: MapperInput.CreateOneRelationInput | undefined,
	): Promise<Result[]> {
		if (input === undefined || input === null) {
			if (processor.nothing) {
				return [await processor.nothing({ ...context, input: undefined })]
			}
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
		throw new ImplementationException()
	}

	private async processManyRelationInput<Context>(
		processor: CreateInputProcessor.HasManyRelationProcessor<Context, Result>,
		context: Context,
		input: MapperInput.CreateManyRelationInput | undefined,
	): Promise<Result[]> {
		if (input === undefined || input === null) {
			return Promise.resolve([])
		}
		const results: Result[] = []
		let i = 0
		for (let element of input) {
			const alias = element.alias
			element = filterObject(element, (k, v) => v !== null && v !== undefined)
			this.verifyOperations(element)
			let result
			if ('connect' in element) {
				result = processor.connect({ ...context, input: element.connect, index: i++, alias })
			}
			if ('create' in element) {
				result = processor.create({ ...context, input: element.create, index: i++, alias })
			}
			if ('connectOrCreate' in element) {
				result = processor.connectOrCreate({ ...context, input: element.connectOrCreate, index: i++, alias })
			}
			if (result !== undefined) {
				results.push(await result)
			}
		}
		return Promise.all(results)
	}

	private verifyOperations(input: object) {
		const keys = Object.keys(input).filter(it => it !== 'alias')
		const ops = Object.values(Input.CreateRelationOperation) as string[]
		if (keys.length !== 1 || !ops.includes(keys[0])) {
			const found = keys.length === 0 ? 'none' : keys.join(', ')
			throw new UserError(
				`Expected exactly one of: ${ops.join(', ')}. ${found} found.`,
			)
		}
	}
}
