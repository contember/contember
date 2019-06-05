import { Input, Model } from 'cms-common'
import { isIt } from '../../utils/type'
import UpdateInputProcessor from './UpdateInputProcessor'

export default class UpdateInputVisitor<V>
	implements
		Model.ColumnVisitor<Promise<V | V[] | undefined>>,
		Model.RelationByTypeVisitor<Promise<V | V[] | undefined>> {
	constructor(
		private readonly updateInputProcessor: UpdateInputProcessor<V>,
		private readonly schema: Model.Schema,
		private readonly data: Input.UpdateDataInput
	) {}

	public visitColumn(entity: Model.Entity, column: Model.AnyColumn): Promise<V> {
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
		return this.processManyRelationInput(this.data[relation.name] as Input.CreateManyRelationInput, {
			connect: (input: Input.UniqueWhere<never>, { index }): Promise<V> => {
				return this.updateInputProcessor.manyHasManyInversed.connect({
					entity,
					relation,
					targetEntity,
					targetRelation,
					input,
					index,
				})
			},
			create: (input: Input.CreateDataInput<never>, { index }): Promise<V> => {
				return this.updateInputProcessor.manyHasManyInversed.create({
					entity,
					relation,
					targetEntity,
					targetRelation,
					input,
					index,
				})
			},
			delete: (input: Input.UniqueWhere<never>, { index }): Promise<V> => {
				return this.updateInputProcessor.manyHasManyInversed.delete({
					entity,
					relation,
					targetEntity,
					targetRelation,
					input,
					index,
				})
			},
			disconnect: (input: Input.UniqueWhere<never>, { index }): Promise<V> => {
				return this.updateInputProcessor.manyHasManyInversed.disconnect({
					entity,
					relation,
					targetEntity,
					targetRelation,
					input,
					index,
				})
			},
			update: (where: Input.UniqueWhere<never>, data: Input.UpdateDataInput<never>, { index }): Promise<V> => {
				return this.updateInputProcessor.manyHasManyInversed.update({
					entity,
					relation,
					targetEntity,
					targetRelation,
					input: { where, data },
					index,
				})
			},
			upsert: (
				where: Input.UniqueWhere<never>,
				update: Input.UpdateDataInput<never>,
				create: Input.CreateDataInput<never>,
				{ index }
			): Promise<V> => {
				return this.updateInputProcessor.manyHasManyInversed.upsert({
					entity,
					relation,
					targetEntity,
					targetRelation,
					input: { where, update, create },
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
				return this.updateInputProcessor.manyHasManyOwner.connect({
					entity,
					relation,
					targetEntity,
					targetRelation,
					input,
					index,
				})
			},
			create: (input: Input.CreateDataInput<never>, { index }): Promise<V> => {
				return this.updateInputProcessor.manyHasManyOwner.create({
					entity,
					relation,
					targetEntity,
					targetRelation,
					input,
					index,
				})
			},
			delete: (input: Input.UniqueWhere<never>, { index }): Promise<V> => {
				return this.updateInputProcessor.manyHasManyOwner.delete({
					entity,
					relation,
					targetEntity,
					targetRelation,
					input,
					index,
				})
			},
			disconnect: (input: Input.UniqueWhere<never>, { index }): Promise<V> => {
				return this.updateInputProcessor.manyHasManyOwner.disconnect({
					entity,
					relation,
					targetEntity,
					targetRelation,
					input,
					index,
				})
			},
			update: (where: Input.UniqueWhere<never>, data: Input.UpdateDataInput<never>, { index }): Promise<V> => {
				return this.updateInputProcessor.manyHasManyOwner.update({
					entity,
					relation,
					targetEntity,
					targetRelation,
					input: { where, data },
					index,
				})
			},
			upsert: (
				where: Input.UniqueWhere<never>,
				update: Input.UpdateDataInput<never>,
				create: Input.CreateDataInput<never>,
				{ index }
			): Promise<V> => {
				return this.updateInputProcessor.manyHasManyOwner.upsert({
					entity,
					relation,
					targetEntity,
					targetRelation,
					input: { where, update, create },
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
				return this.updateInputProcessor.manyHasOne.connect({
					entity,
					relation,
					targetEntity,
					targetRelation,
					input,
				})
			},
			create: (input: Input.CreateDataInput<never>): Promise<V> => {
				return this.updateInputProcessor.manyHasOne.create({
					entity,
					relation,
					targetEntity,
					targetRelation,
					input,
				})
			},
			delete: (): Promise<V> => {
				return this.updateInputProcessor.manyHasOne.delete({
					entity,
					relation,
					targetEntity,
					targetRelation,
					input: undefined,
				})
			},
			disconnect: (): Promise<V> => {
				return this.updateInputProcessor.manyHasOne.disconnect({
					entity,
					relation,
					targetEntity,
					targetRelation,
					input: undefined,
				})
			},
			update: (input: Input.UpdateDataInput<never>): Promise<V> => {
				return this.updateInputProcessor.manyHasOne.update({
					entity,
					relation,
					targetEntity,
					targetRelation,
					input,
				})
			},
			upsert: (update: Input.UpdateDataInput<never>, create: Input.CreateDataInput<never>): Promise<V> => {
				return this.updateInputProcessor.manyHasOne.upsert({
					entity,
					relation,
					targetEntity,
					targetRelation,
					input: { update, create },
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
				return this.updateInputProcessor.oneHasMany.connect({
					entity,
					relation,
					targetEntity,
					targetRelation,
					input,
					index,
				})
			},
			create: (input: Input.CreateDataInput<never>, { index }): Promise<V> => {
				return this.updateInputProcessor.oneHasMany.create({
					entity,
					relation,
					targetEntity,
					targetRelation,
					input,
					index,
				})
			},
			delete: (input: Input.UniqueWhere<never>, { index }): Promise<V> => {
				return this.updateInputProcessor.oneHasMany.delete({
					entity,
					relation,
					targetEntity,
					targetRelation,
					input,
					index,
				})
			},
			disconnect: (input: Input.UniqueWhere<never>, { index }): Promise<V> => {
				return this.updateInputProcessor.oneHasMany.disconnect({
					entity,
					relation,
					targetEntity,
					targetRelation,
					input,
					index,
				})
			},
			update: (where: Input.UniqueWhere<never>, data: Input.UpdateDataInput<never>, { index }): Promise<V> => {
				return this.updateInputProcessor.oneHasMany.update({
					entity,
					relation,
					targetEntity,
					targetRelation,
					input: { where, data },
					index,
				})
			},
			upsert: (
				where: Input.UniqueWhere<never>,
				update: Input.UpdateDataInput<never>,
				create: Input.CreateDataInput<never>,
				{ index }
			): Promise<V> => {
				return this.updateInputProcessor.oneHasMany.upsert({
					entity,
					relation,
					targetEntity,
					targetRelation,
					input: { where, update, create },
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
				return this.updateInputProcessor.oneHasOneInversed.connect({
					entity,
					relation,
					targetEntity,
					targetRelation,
					input,
				})
			},
			create: (input: Input.CreateDataInput<never>): Promise<V> => {
				return this.updateInputProcessor.oneHasOneInversed.create({
					entity,
					relation,
					targetEntity,
					targetRelation,
					input,
				})
			},
			delete: (): Promise<V> => {
				return this.updateInputProcessor.oneHasOneInversed.delete({
					entity,
					relation,
					targetEntity,
					targetRelation,
					input: undefined,
				})
			},
			disconnect: (): Promise<V> => {
				return this.updateInputProcessor.oneHasOneInversed.disconnect({
					entity,
					relation,
					targetEntity,
					targetRelation,
					input: undefined,
				})
			},
			update: (input: Input.UpdateDataInput<never>): Promise<V> => {
				return this.updateInputProcessor.oneHasOneInversed.update({
					entity,
					relation,
					targetEntity,
					targetRelation,
					input,
				})
			},
			upsert: (update: Input.UpdateDataInput<never>, create: Input.CreateDataInput<never>): Promise<V> => {
				return this.updateInputProcessor.oneHasOneInversed.upsert({
					entity,
					relation,
					targetEntity,
					targetRelation,
					input: { update, create },
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
				return this.updateInputProcessor.oneHasOneOwner.connect({
					entity,
					relation,
					targetEntity,
					targetRelation,
					input,
				})
			},
			create: (input: Input.CreateDataInput<never>): Promise<V> => {
				return this.updateInputProcessor.oneHasOneOwner.create({
					entity,
					relation,
					targetEntity,
					targetRelation,
					input,
				})
			},
			delete: (): Promise<V> => {
				return this.updateInputProcessor.oneHasOneOwner.delete({
					entity,
					relation,
					targetEntity,
					targetRelation,
					input: undefined,
				})
			},
			disconnect: (): Promise<V> => {
				return this.updateInputProcessor.oneHasOneOwner.disconnect({
					entity,
					relation,
					targetEntity,
					targetRelation,
					input: undefined,
				})
			},
			update: (input: Input.UpdateDataInput<never>): Promise<V> => {
				return this.updateInputProcessor.oneHasOneOwner.update({
					entity,
					relation,
					targetEntity,
					targetRelation,
					input,
				})
			},
			upsert: (update: Input.UpdateDataInput<never>, create: Input.CreateDataInput<never>): Promise<V> => {
				return this.updateInputProcessor.oneHasOneOwner.upsert({
					entity,
					relation,
					targetEntity,
					targetRelation,
					input: { update, create },
				})
			},
		})
	}

	private processRelationInput<AdditionalData = {}>(
		input: Input.CreateOneRelationInput | undefined,
		processor: HasOneRelationInputProcessor<V, AdditionalData>
	): Promise<undefined | V> {
		return this.doProcessRelationInput(input, processor, {})
	}

	private doProcessRelationInput<AdditionalData = {}>(
		input: Input.CreateOneRelationInput | undefined,
		processor: HasOneRelationInputProcessor<V, AdditionalData>,
		additional: AdditionalData
	): Promise<undefined | V> {
		if (input === undefined) {
			return Promise.resolve(undefined)
		}
		const operation = []
		let result: Promise<V> | null = null
		if (isIt<Input.ConnectRelationInput>(input, 'connect')) {
			operation.push('connect')
			result = processor.connect(input.connect, additional)
		}
		if (isIt<Input.CreateRelationInput>(input, 'create')) {
			operation.push('create')
			result = processor.create(input.create, additional)
		}
		if (isIt<Input.DeleteRelationInput>(input, 'delete')) {
			operation.push('delete')
			result = processor.delete(additional)
		}
		if (isIt<Input.DisconnectRelationInput>(input, 'disconnect')) {
			operation.push('disconnect')
			result = processor.disconnect(additional)
		}
		if (isIt<Input.UpdateRelationInput>(input, 'update')) {
			operation.push('update')
			result = processor.update(input.update, additional)
		}
		if (isIt<Input.UpsertRelationInput>(input, 'upsert')) {
			operation.push('upsert')
			result = processor.upsert(input.upsert.update, input.upsert.create, additional)
		}

		if (operation.length !== 1) {
			const found = operation.length === 0 ? 'none' : 'both'
			throw new Error(`Expected either "create" or "connect", ${found} found.`)
		}
		if (result === null) {
			throw new Error()
		}
		return result
	}

	private processManyRelationInput(
		input: Input.CreateManyRelationInput | undefined,
		processor: HasManyRelationInputProcessor<V, { index: number }>
	): Promise<undefined | V[]> {
		if (input === undefined) {
			return Promise.resolve(undefined)
		}
		const promises: Array<Promise<V>> = []
		let i = 0
		for (const element of input) {
			const operation = []
			let result
			const additional = { index: i }
			if (isIt<Input.ConnectRelationInput>(element, 'connect')) {
				operation.push('connect')
				result = processor.connect(element.connect, additional)
			}
			if (isIt<Input.CreateRelationInput>(element, 'create')) {
				operation.push('create')
				result = processor.create(element.create, additional)
			}
			if (isIt<Input.DeleteSpecifiedRelationInput>(element, 'delete')) {
				operation.push('delete')
				result = processor.delete(element.delete, additional)
			}
			if (isIt<Input.DisconnectSpecifiedRelationInput>(element, 'disconnect')) {
				operation.push('disconnect')
				result = processor.disconnect(element.disconnect, additional)
			}
			if (isIt<Input.UpdateSpecifiedRelationInput>(element, 'update')) {
				operation.push('update')
				result = processor.update(element.update.by, element.update.data, additional)
			}
			if (isIt<Input.UpsertSpecifiedRelationInput>(element, 'upsert')) {
				operation.push('upsert')
				result = processor.upsert(element.upsert.by, element.upsert.update, element.upsert.create, additional)
			}
			if (operation.length !== 1) {
				const found = operation.length === 0 ? 'none' : operation.join(', ')
				throw new Error(
					`Expected exactly one of: "create", "connect", "delete", "disconnect", "update" or "upsert". ${found} found.`
				)
			}
			if (result !== undefined) {
				promises.push(result)
			}
		}
		return Promise.all(promises)
	}
}

interface HasOneRelationInputProcessor<V, AdditionalData> {
	connect(input: Input.UniqueWhere, data: AdditionalData): Promise<V>

	create(input: Input.CreateDataInput, data: AdditionalData): Promise<V>

	update(input: Input.UpdateDataInput, data: AdditionalData): Promise<V>

	upsert(update: Input.UpdateDataInput, create: Input.CreateDataInput, data: AdditionalData): Promise<V>

	disconnect(data: AdditionalData): Promise<V>

	delete(data: AdditionalData): Promise<V>
}

interface HasManyRelationInputProcessor<V, AdditionalData> {
	connect(input: Input.UniqueWhere, data: AdditionalData): Promise<V>

	create(input: Input.CreateDataInput, data: AdditionalData): Promise<V>

	update(where: Input.UniqueWhere, input: Input.UpdateDataInput, data: AdditionalData): Promise<V>

	upsert(
		where: Input.UniqueWhere,
		update: Input.UpdateDataInput,
		create: Input.CreateDataInput,
		data: AdditionalData
	): Promise<V>

	disconnect(where: Input.UniqueWhere, data: AdditionalData): Promise<V>

	delete(where: Input.UniqueWhere, data: AdditionalData): Promise<V>
}
