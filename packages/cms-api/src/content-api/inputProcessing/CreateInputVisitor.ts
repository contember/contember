import { Input, Model } from 'cms-common'
import CreateInputProcessor from './CreateInputProcessor'
import { isIt } from '../../utils/type'

interface RelationInputProcessor<V> {
	connect(input: Input.UniqueWhere): Promise<V>

	create(input: Input.CreateDataInput): Promise<V>
}

export default class InsertVisitor<V>
	implements
		Model.ColumnVisitor<Promise<V | V[] | undefined>>,
		Model.RelationByTypeVisitor<Promise<V | V[] | undefined>> {
	constructor(
		private readonly createInputProcessor: CreateInputProcessor<V>,
		private readonly schema: Model.Schema,
		private readonly data: Input.CreateDataInput
	) {}

	public visitColumn(entity: Model.Entity, column: Model.AnyColumn): Promise<V> {
		return this.createInputProcessor.processColumn({
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
			connect: (input: Input.UniqueWhere<never>): Promise<V> => {
				return this.createInputProcessor.processManyHasManyInversedConnect({
					entity,
					relation,
					targetEntity,
					targetRelation,
					input,
				})
			},
			create: (input: Input.CreateDataInput<never>): Promise<V> => {
				return this.createInputProcessor.processManyHasManyInversedCreate({
					entity,
					relation,
					targetEntity,
					targetRelation,
					input,
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
			connect: (input: Input.UniqueWhere<never>): Promise<V> => {
				return this.createInputProcessor.processManyHasManyOwnerConnect({
					entity,
					relation,
					targetEntity,
					targetRelation,
					input,
				})
			},
			create: (input: Input.CreateDataInput<never>): Promise<V> => {
				return this.createInputProcessor.processManyHasManyOwnerCreate({
					entity,
					relation,
					targetEntity,
					targetRelation,
					input,
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
				return this.createInputProcessor.processManyHasOneConnect({
					entity,
					relation,
					targetEntity,
					targetRelation,
					input,
				})
			},
			create: (input: Input.CreateDataInput<never>): Promise<V> => {
				return this.createInputProcessor.processManyHasOneCreate({
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
			connect: (input: Input.UniqueWhere<never>): Promise<V> => {
				return this.createInputProcessor.processOneHasManyConnect({
					entity,
					relation,
					targetEntity,
					targetRelation,
					input,
				})
			},
			create: (input: Input.CreateDataInput<never>): Promise<V> => {
				return this.createInputProcessor.processOneHasManyCreate({
					entity,
					relation,
					targetEntity,
					targetRelation,
					input,
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
				return this.createInputProcessor.processOneHasOneInversedConnect({
					entity,
					relation,
					targetEntity,
					targetRelation,
					input,
				})
			},
			create: (input: Input.CreateDataInput<never>): Promise<V> => {
				return this.createInputProcessor.processOneHasOneInversedCreate({
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
				return this.createInputProcessor.processOneHasOneOwnerConnect({
					entity,
					relation,
					targetEntity,
					targetRelation,
					input,
				})
			},
			create: (input: Input.CreateDataInput<never>): Promise<V> => {
				return this.createInputProcessor.processOneHasOneOwnerCreate({
					entity,
					relation,
					targetEntity,
					targetRelation,
					input,
				})
			},
		})
	}

	private processRelationInput(
		input: Input.CreateOneRelationInput | undefined,
		processor: RelationInputProcessor<V>
	): Promise<undefined | V> {
		if (input === undefined) {
			return Promise.resolve(undefined)
		}
		const relations = []
		let result: Promise<V> | null = null
		if (isIt<Input.ConnectRelationInput>(input, 'connect')) {
			relations.push('connect')
			result = processor.connect(input.connect)
		}
		if (isIt<Input.CreateRelationInput>(input, 'create')) {
			relations.push('create')
			result = processor.create(input.create)
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
		processor: RelationInputProcessor<V>
	): Promise<undefined | V[]> {
		if (input === undefined) {
			return Promise.resolve(undefined)
		}
		const promises = []
		for (const element of input) {
			const result = this.processRelationInput(element, processor) as Promise<V>
			promises.push(result)
		}
		return Promise.all(promises)
	}
}
