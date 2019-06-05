import { Input, Model } from 'cms-common'
import CreateInputProcessor from './CreateInputProcessor'
import { isIt } from '../../utils/type'

export default class CreateInputVisitor<V>
	implements
		Model.ColumnVisitor<Promise<V | V[] | undefined>>,
		Model.RelationByTypeVisitor<Promise<V | V[] | undefined>> {
	constructor(
		private readonly createInputProcessor: CreateInputProcessor<V>,
		private readonly schema: Model.Schema,
		private readonly data: Input.CreateDataInput
	) {}

	public visitColumn(entity: Model.Entity, column: Model.AnyColumn): Promise<V> {
		return this.createInputProcessor.column({
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
		return this.processManyRelationInput(this.data[relation.name] as Input.CreateManyRelationInput, {
			connect: (input: Input.UniqueWhere<never>, { index }): Promise<V> => {
				return this.createInputProcessor.manyHasManyInversed.connect({
					entity,
					relation,
					targetEntity,
					targetRelation,
					input,
					index,
				})
			},
			create: (input: Input.CreateDataInput<never>, { index }): Promise<V> => {
				return this.createInputProcessor.manyHasManyInversed.create({
					entity,
					relation,
					targetEntity,
					targetRelation,
					input,
					index,
				})
			},
		})
	}

	public visitManyHasManyOwner(
		entity: Model.Entity,
		relation: Model.ManyHasManyOwnerRelation,
		targetEntity: Model.Entity,
		targetRelation: Model.ManyHasManyInversedRelation | null
	) {
		return this.processManyRelationInput(this.data[relation.name] as Input.CreateManyRelationInput, {
			connect: (input: Input.UniqueWhere<never>, { index }): Promise<V> => {
				return this.createInputProcessor.manyHasManyOwner.connect({
					entity,
					relation,
					targetEntity,
					targetRelation,
					input,
					index,
				})
			},
			create: (input: Input.CreateDataInput<never>, { index }): Promise<V> => {
				return this.createInputProcessor.manyHasManyOwner.create({
					entity,
					relation,
					targetEntity,
					targetRelation,
					input,
					index,
				})
			},
		})
	}

	public visitManyHasOne(
		entity: Model.Entity,
		relation: Model.ManyHasOneRelation,
		targetEntity: Model.Entity,
		targetRelation: Model.OneHasManyRelation | null
	) {
		return this.processRelationInput(this.data[relation.name] as Input.CreateOneRelationInput, {
			connect: (input: Input.UniqueWhere<never>): Promise<V> => {
				return this.createInputProcessor.manyHasOne.connect({
					entity,
					relation,
					targetEntity,
					targetRelation,
					input,
				})
			},
			create: (input: Input.CreateDataInput<never>): Promise<V> => {
				return this.createInputProcessor.manyHasOne.create({
					entity,
					relation,
					targetEntity,
					targetRelation,
					input,
				})
			},
		})
	}

	public visitOneHasMany(
		entity: Model.Entity,
		relation: Model.OneHasManyRelation,
		targetEntity: Model.Entity,
		targetRelation: Model.ManyHasOneRelation
	) {
		return this.processManyRelationInput(this.data[relation.name] as Input.CreateManyRelationInput, {
			connect: (input: Input.UniqueWhere<never>, { index }): Promise<V> => {
				return this.createInputProcessor.oneHasMany.connect({
					entity,
					relation,
					targetEntity,
					targetRelation,
					input,
					index,
				})
			},
			create: (input: Input.CreateDataInput<never>, { index }): Promise<V> => {
				return this.createInputProcessor.oneHasMany.create({
					entity,
					relation,
					targetEntity,
					targetRelation,
					input,
					index,
				})
			},
		})
	}

	public visitOneHasOneInversed(
		entity: Model.Entity,
		relation: Model.OneHasOneInversedRelation,
		targetEntity: Model.Entity,
		targetRelation: Model.OneHasOneOwnerRelation
	) {
		return this.processRelationInput(this.data[relation.name] as Input.CreateOneRelationInput, {
			connect: (input: Input.UniqueWhere<never>): Promise<V> => {
				return this.createInputProcessor.oneHasOneInversed.connect({
					entity,
					relation,
					targetEntity,
					targetRelation,
					input,
				})
			},
			create: (input: Input.CreateDataInput<never>): Promise<V> => {
				return this.createInputProcessor.oneHasOneInversed.create({
					entity,
					relation,
					targetEntity,
					targetRelation,
					input,
				})
			},
		})
	}

	public visitOneHasOneOwner(
		entity: Model.Entity,
		relation: Model.OneHasOneOwnerRelation,
		targetEntity: Model.Entity,
		targetRelation: Model.OneHasOneInversedRelation | null
	) {
		return this.processRelationInput(this.data[relation.name] as Input.CreateOneRelationInput, {
			connect: (input: Input.UniqueWhere<never>): Promise<V> => {
				return this.createInputProcessor.oneHasOneOwner.connect({
					entity,
					relation,
					targetEntity,
					targetRelation,
					input,
				})
			},
			create: (input: Input.CreateDataInput<never>): Promise<V> => {
				return this.createInputProcessor.oneHasOneOwner.create({
					entity,
					relation,
					targetEntity,
					targetRelation,
					input,
				})
			},
		})
	}

	private processRelationInput<AdditionalData = {}>(
		input: Input.CreateOneRelationInput | undefined,
		processor: RelationInputProcessor<V, AdditionalData>
	): Promise<undefined | V> {
		return this.doProcessRelationInput(input, processor, {})
	}

	private doProcessRelationInput<AdditionalData = {}>(
		input: Input.CreateOneRelationInput | undefined,
		processor: RelationInputProcessor<V, AdditionalData>,
		additional: AdditionalData
	): Promise<undefined | V> {
		if (input === undefined) {
			return Promise.resolve(undefined)
		}
		const relations = []
		let result: Promise<V> | null = null
		if (isIt<Input.ConnectRelationInput>(input, 'connect')) {
			relations.push('connect')
			result = processor.connect(input.connect, additional)
		}
		if (isIt<Input.CreateRelationInput>(input, 'create')) {
			relations.push('create')
			result = processor.create(input.create, additional)
		}

		if (relations.length !== 1) {
			const found = relations.length === 0 ? 'none' : 'both'
			throw new Error(`Expected either "create" or "connect", ${found} found.`)
		}
		if (result === null) {
			throw new Error()
		}
		return result
	}

	private processManyRelationInput(
		input: Input.CreateManyRelationInput | undefined,
		processor: RelationInputProcessor<V, { index: number }>
	): Promise<undefined | V[]> {
		if (input === undefined) {
			return Promise.resolve(undefined)
		}
		const promises = []
		let i = 0
		for (const element of input) {
			const result = this.doProcessRelationInput(element, processor, { index: i++ }) as Promise<V>
			promises.push(result)
		}
		return Promise.all(promises)
	}
}

interface RelationInputProcessor<V, AdditionalData> {
	connect(input: Input.UniqueWhere, data: AdditionalData): Promise<V>

	create(input: Input.CreateDataInput, data: AdditionalData): Promise<V>
}
