import { isIt } from '../utils'
import { Input, Model } from '@contember/schema'
import { CreateInputProcessor } from './CreateInputProcessor'
import { filterObject } from '../utils'
import { UserError } from '../exception'
import { ImplementationException } from '../exception'

export class CreateInputVisitor<Result> implements
	Model.ColumnVisitor<Promise<Result | Result[] | undefined>>,
	Model.RelationByTypeVisitor<Promise<Result | Result[] | undefined>> {

	constructor(
		private readonly createInputProcessor: CreateInputProcessor<Result>,
		private readonly schema: Model.Schema,
		private readonly data: Input.CreateDataInput,
	) {}

	public visitColumn(context: Model.ColumnContext): Promise<Result> {
		return this.createInputProcessor.column({
			...context,
			input: this.data[context.column.name] as Input.ColumnValue,
		})
	}

	public visitManyHasManyInverse(context: Model.ManyHasManyInverseContext) {
		return this.processManyRelationInput(
			this.createInputProcessor.manyHasManyInverse,
			context,
			this.data[context.relation.name] as Input.CreateManyRelationInput,
		)
	}

	public visitManyHasManyOwning(context: Model.ManyHasManyOwningContext) {
		return this.processManyRelationInput(
			this.createInputProcessor.manyHasManyOwning,
			context,
			this.data[context.relation.name] as Input.CreateManyRelationInput,
		)
	}

	public visitManyHasOne(context: Model.ManyHasOneContext) {
		return this.processRelationInput(
			this.createInputProcessor.manyHasOne,
			context,
			this.data[context.relation.name] as Input.CreateOneRelationInput,
		)
	}

	public visitOneHasMany(context: Model.OneHasManyContext) {
		return this.processManyRelationInput(
			this.createInputProcessor.oneHasMany,
			context,
			this.data[context.relation.name] as Input.CreateManyRelationInput,
		)
	}

	public visitOneHasOneInverse(context: Model.OneHasOneInverseContext) {
		return this.processRelationInput(
			this.createInputProcessor.oneHasOneInverse,
			context,
			this.data[context.relation.name] as Input.CreateOneRelationInput,
		)
	}

	public visitOneHasOneOwning(context: Model.OneHasOneOwningContext) {
		return this.processRelationInput(
			this.createInputProcessor.oneHasOneOwning,
			context,
			this.data[context.relation.name] as Input.CreateOneRelationInput,
		)
	}

	private processRelationInput<Context>(
		processor: CreateInputProcessor.HasOneRelationProcessor<Context, Result>,
		context: Context,
		input: Input.CreateOneRelationInput | undefined,
	): Promise<undefined | Result> {
		if (input === undefined || input === null) {
			if (processor.nothing) {
				return processor.nothing({ ...context, input: undefined })
			}
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
		throw new ImplementationException()
	}

	private async processManyRelationInput<Context>(
		processor: CreateInputProcessor.HasManyRelationProcessor<Context, Result>,
		context: Context,
		input: Input.CreateManyRelationInput | undefined,
	): Promise<undefined | Result[]> {
		if (input === undefined || input === null) {
			return Promise.resolve(undefined)
		}
		const results: Result[] = []
		let i = 0
		for (let element of input) {
			const alias = element.alias
			element = filterObject(element, (k, v) => v !== null && v !== undefined)
			this.verifyOperations(element)
			let result
			if (isIt<Input.ConnectRelationInput>(element, 'connect')) {
				result = processor.connect({ ...context, input: element.connect, index: i++, alias })
			}
			if (isIt<Input.CreateRelationInput>(element, 'create')) {
				result = processor.create({ ...context, input: element.create, index: i++, alias })
			}
			if (result !== undefined) {
				results.push(await result)
			}
		}
		return Promise.all(results)
	}

	private verifyOperations(input: object) {
		const keys = Object.keys(input).filter(it => it !== 'alias')
		if (keys.length !== 1 || !['create', 'connect'].includes(keys[0])) {
			const found = keys.length === 0 ? 'none' : keys.join(', ')
			throw new UserError(`Expected either "create" or "connect". ${found} found.`)
		}
	}
}
