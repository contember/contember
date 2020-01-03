import { GraphQlBuilder } from '@contember/client'
import { Value } from 'slate'
import {
	EntityAccessor,
	EntityForRemovalAccessor,
	EntityListAccessor,
	FieldAccessor,
	getRelativeSingleField,
	RelativeSingleField,
} from '../../../binding'
import JsonBlockSerializer from './JsonBlockSerializer'
import { BlocksDefinitions } from './types'

type GetListAccessor = () => EntityListAccessor

export default class OperationProcessor {
	constructor(
		private readonly accessor: EntityListAccessor,
		private readonly sortBy: RelativeSingleField,
		private readonly typeField: RelativeSingleField,
		private readonly blocks: BlocksDefinitions,
		private readonly defaultBlock: string,
	) {}

	private readonly blockNodesSerializer = new JsonBlockSerializer()

	private getLastInCollection = (getListAccessor: GetListAccessor): EntityAccessor => {
		const listAccessorAfterAddition = getListAccessor()
		const entity = listAccessorAfterAddition.entities[listAccessorAfterAddition.entities.length - 1]
		if (!(entity instanceof EntityAccessor)) {
			throw new Error('')
		}
		return entity
	}

	private addToEnd = (getListAccessor: GetListAccessor, type: string): EntityAccessor => {
		const listAccessor = getListAccessor()
		if (listAccessor.addNew === undefined) {
			throw new Error('')
		}
		listAccessor.addNew && listAccessor.addNew()
		const entity = this.getLastInCollection(getListAccessor)
		const typeField = getRelativeSingleField(entity, this.typeField)
		if (!(typeField instanceof FieldAccessor)) {
			throw new Error('')
		}
		if (typeField.updateValue === undefined) {
			throw new Error('')
		}
		typeField.updateValue(new GraphQlBuilder.Literal(type))
		return this.getLastInCollection(getListAccessor)
	}

	processValue(value: Value) {
		this.accessor.batchUpdates &&
			this.accessor.batchUpdates(getAccessor => {
				const presentKeys = new Set<string>()
				let maxOrder = 0
				value.document.nodes.forEach((block_, key) => {
					const block = block_!
					if (block.object !== 'block') {
						throw new Error('Only blocks are supported on top level in document.')
					}
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
							const oldValue = valueFieldAccessor.currentValue || ''
							if (typeof oldValue !== 'string') {
								throw new Error(`Value for block ${block.type} is of type ${typeof oldValue} instead of string`)
							}
							const newValue: string = this.blockNodesSerializer.serialize(block)
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

				let collection = getAccessor()
				const toRemove = new Set<string>()
				collection.entities.forEach(ea => {
					if (ea !== undefined && !(ea instanceof EntityForRemovalAccessor) && !presentKeys.has(ea.getKey())) {
						toRemove.add(ea.getKey())
					}
				})
				toRemove.forEach(key => {
					const ea = collection.findByKey(key)
					if (ea === undefined || ea instanceof EntityForRemovalAccessor) {
						throw new Error('This should never happen')
					}
					ea.remove && ea.remove('delete')
					collection = getAccessor()
				})
			})
	}

	private getSortFieldAccessor = (entityAccessor: EntityAccessor): FieldAccessor => {
		const sortFieldAccessor = getRelativeSingleField(entityAccessor, this.sortBy)
		if (!(sortFieldAccessor instanceof FieldAccessor)) {
			throw new Error('Unable to find sort field.')
		}
		return sortFieldAccessor
	}

	private getValueFieldAccessor = (entityAccessor: EntityAccessor): FieldAccessor => {
		const typeField = getRelativeSingleField(entityAccessor, this.typeField)
		if (!(typeField instanceof FieldAccessor)) {
			throw new Error('Not found type field')
		}
		let type = typeField.currentValue || this.defaultBlock
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
		const valueFieldAccessor = entityAccessor.getField(definition.valueField)
		if (!(valueFieldAccessor instanceof FieldAccessor)) {
			throw new Error(`Value field ${definition.valueField} is not field`)
		}
		return valueFieldAccessor
	}
}
