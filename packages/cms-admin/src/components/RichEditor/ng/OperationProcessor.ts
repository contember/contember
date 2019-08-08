import { Value } from 'slate'
import { EntityAccessor, EntityCollectionAccessor, EntityForRemovalAccessor, FieldAccessor } from '../../../binding/dao'
import JsonBlockSerializer from './JsonBlockSerializer'
import { GraphQlBuilder } from 'cms-client'
import { BlocksDefinitions } from './types'

type GetCollectionAccessor = () => EntityCollectionAccessor

export default class OperationProcessor {
	constructor(
		private readonly accessor: EntityCollectionAccessor,
		private readonly sortBy: string,
		private readonly typeField: string,
		private readonly blocks: BlocksDefinitions,
		private readonly defaultBlock: string,
	) {}

	private readonly blockNodesSerializer = new JsonBlockSerializer()

	private getLastInCollection = (getCollectionAccessor: GetCollectionAccessor): EntityAccessor => {
		const collectionAccessorAfterAddition = getCollectionAccessor()
		const entity = collectionAccessorAfterAddition.entities[collectionAccessorAfterAddition.entities.length - 1]
		if (!(entity instanceof EntityAccessor)) {
			throw new Error('')
		}
		return entity
	}

	private addToEnd = (getCollectionAccessor: GetCollectionAccessor, type: string): EntityAccessor => {
		const collectionAccessor = getCollectionAccessor()
		if (collectionAccessor.addNew === undefined) {
			throw new Error('')
		}
		collectionAccessor.addNew && collectionAccessor.addNew()
		const entity = this.getLastInCollection(getCollectionAccessor)
		const typeField = entity.data.getField(this.typeField)
		if (!(typeField instanceof FieldAccessor)) {
			throw new Error('')
		}
		if (typeField.updateValue === undefined) {
			throw new Error('')
		}
		typeField.updateValue(new GraphQlBuilder.Literal(type))
		return this.getLastInCollection(getCollectionAccessor)
	}

	processValue(value: Value) {
		this.accessor.batchUpdates &&
			this.accessor.batchUpdates(getAccessor => {
				const presentKeys = new Set<string>()
				let maxOrder = 0
				value.document.nodes.forEach((block_, key) => {
					const block = block_!
					const accessor: EntityAccessor | { primaryKey: string | { value: string } } | undefined = block.data.get(
						'accessor',
					)
					const definition = this.blocks[block.type]
					if (definition === undefined) {
						throw new Error('Unknown block')
					}
					// If accessor not present (node added) or node already processed (splitted node)
					let afterAccessor: EntityAccessor
					if (accessor !== undefined && !(accessor instanceof EntityAccessor)) {
						// Copy-pasting - just skip it.
						return
					} else if (
						accessor === undefined ||
						!(accessor instanceof EntityAccessor) ||
						presentKeys.has(accessor.getKey())
					) {
						console.log(`New block ${block.type}`)
						// New block
						const entity = this.addToEnd(getAccessor, block.type)
						presentKeys.add(entity.getKey())
						if (definition.renderBlock !== undefined) {
							// SlateBlock
							const valueFieldAccessor = this.getValueFieldAccessor(entity)
							if (valueFieldAccessor.updateValue === undefined) {
								return
							}
							valueFieldAccessor.updateValue(this.blockNodesSerializer.serialize(block))
						}
						afterAccessor = this.getLastInCollection(getAccessor)
					} else {
						// Persisted, maybe with change
						presentKeys.add(accessor.getKey())
						if (definition.renderBlock !== undefined) {
							const valueFieldAccessor = this.getValueFieldAccessor(accessor)
							if (valueFieldAccessor.updateValue === undefined) {
								return
							}
							if (typeof valueFieldAccessor.currentValue !== 'string') {
								throw new Error(
									`Value for block ${
										block.type
									} is of type ${typeof valueFieldAccessor.currentValue} instead of string`,
								)
							}
							const newValue: string = this.blockNodesSerializer.serialize(block)
							const oldValue: string = valueFieldAccessor.currentValue
							if (newValue !== oldValue) {
								valueFieldAccessor.updateValue(newValue)
							}
							const afterAccessorUnchecked = getAccessor().findByKey(accessor.getKey())
							if (!(afterAccessorUnchecked instanceof EntityAccessor)) {
								throw new Error('Type of accessor changed during saving changes. This should never happen.')
							}
							afterAccessor = afterAccessorUnchecked
						} else {
							afterAccessor = accessor
						}
					}
					const sortField = this.getSortFieldAccessor(afterAccessor)
					if (sortField.updateValue === undefined) {
						throw new Error('Unable to change sort field')
					}
					if (
						sortField.currentValue === null ||
						typeof sortField.currentValue !== 'number' ||
						sortField.currentValue <= maxOrder
					) {
						sortField.updateValue(maxOrder + 1)
						maxOrder = maxOrder + 1
					} else {
						maxOrder = sortField.currentValue
					}
				})

				console.log(presentKeys)
				let collection = getAccessor()
				const toRemove = new Set<string>()
				collection.entities.forEach(ea => {
					if (ea !== undefined && !(ea instanceof EntityForRemovalAccessor) && !presentKeys.has(ea.getKey())) {
						toRemove.add(ea.getKey())
					}
				})
				toRemove.forEach(key => {
					console.log(`Removing ${key}`)
					const ea = collection.findByKey(key)
					if (ea === undefined || ea instanceof EntityForRemovalAccessor) {
						throw new Error('This should never happen')
					}
					ea.remove && ea.remove(EntityAccessor.RemovalType.Delete)
					collection = getAccessor()
				})
			})
	}

	private getSortFieldAccessor = (entityAccessor: EntityAccessor): FieldAccessor => {
		const sortFieldAccessor = entityAccessor.data.getField(this.sortBy)
		if (!(sortFieldAccessor instanceof FieldAccessor)) {
			throw new Error('Unable to find sort field.')
		}
		return sortFieldAccessor
	}

	private getValueFieldAccessor = (entityAccessor: EntityAccessor): FieldAccessor => {
		const typeField = entityAccessor.data.getField(this.typeField)
		if (!(typeField instanceof FieldAccessor)) {
			throw new Error('Not found type field')
		}
		let type = typeField.currentValue
		if (type instanceof GraphQlBuilder.Literal) {
			type = type.value
		}
		if (typeof type !== 'string') {
			throw new Error('Value of type field is not string or GraphQL literal')
		}
		const definition = this.blocks[type]
		if (definition.renderBlock === undefined) {
			throw new Error('Unable to get value block for custom field')
		}
		const valueFieldAccessor = entityAccessor.data.getField(definition.valueField)
		if (!(valueFieldAccessor instanceof FieldAccessor)) {
			throw new Error(`Value field ${definition.valueField} is not field`)
		}
		return valueFieldAccessor
	}
}
