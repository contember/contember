import { addNewEntityAtIndex, BindingError, EntityAccessor, FieldValue } from '@contember/binding'
import { Element, NodeOperation, TextOperation } from 'slate'
import { isContemberBlockElement } from '../elements'
import { BlockSlateEditor } from './BlockSlateEditor'
import { OverrideApplyOptions } from './overrideApply'

export const applyBlockOperation = <E extends BlockSlateEditor>(
	editor: E,
	apply: E['apply'],
	operation: NodeOperation | TextOperation,
	options: OverrideApplyOptions,
) => {
	const {
		batchUpdates,
		desugaredEntityList,
		discriminationField,
		normalizedLeadingFieldsRef,
		removalType,
		sortableByField,
		sortedEntitiesRef,
		textBlockDiscriminant,
		textBlockField,
		textElementCache,
	} = options

	const { path } = operation
	const [topLevelIndex] = path
	const firstContentIndex = normalizedLeadingFieldsRef.current.length
	let sortedEntities = sortedEntitiesRef.current

	batchUpdates(getAccessor => {
		const getFreshEntity = (sortedEntityIndex: number): EntityAccessor => {
			const oldEntityKey = sortedEntities[sortedEntityIndex].getKey()
			const newEntity = getAccessor()
				.getRelativeEntityList(desugaredEntityList)
				.getByKey(oldEntityKey)
			if (!(newEntity instanceof EntityAccessor)) {
				throw new BindingError(`Corrupted data`)
			}
			return newEntity
		}
		const saveTextElementAt = (
			elementIndex: number,
			entity: EntityAccessor = getFreshEntity(elementIndex - firstContentIndex),
		) => {
			const targetElement = editor.children[elementIndex]
			if (!Element.isElement(targetElement)) {
				throw new BindingError(`Corrupted data`)
			}
			entity.getRelativeSingleField(textBlockField).updateValue?.(JSON.stringify(targetElement))
			const sortedEntityIndex = elementIndex - firstContentIndex
			const updatedEntity = getFreshEntity(sortedEntityIndex)
			textElementCache.set(updatedEntity, targetElement)
			sortedEntities[sortedEntityIndex] = updatedEntity
		}
		const removeElementAt = (elementIndex: number) => {
			const sortedEntityIndex = elementIndex - firstContentIndex
			sortedEntities[sortedEntityIndex].remove?.(removalType)
			sortedEntities.splice(sortedEntityIndex, 1)
		}
		const addNewDiscriminatedEntityAt = (elementIndex: number, blockDiscriminant: FieldValue): EntityAccessor => {
			addNewEntityAtIndex(
				getAccessor().getRelativeEntityList(desugaredEntityList),
				sortableByField,
				elementIndex,
				(getInnerAccessor, newEntityIndex) => {
					const newEntity = getInnerAccessor().entities[newEntityIndex] as EntityAccessor
					newEntity.getRelativeSingleField(discriminationField).updateValue?.(blockDiscriminant)
					sortedEntities[elementIndex - firstContentIndex] = getInnerAccessor().entities[
						newEntityIndex
					] as EntityAccessor
				},
			)
			return sortedEntities[elementIndex - firstContentIndex]
		}
		const addNewTextElementAt = (elementIndex: number) => {
			const newEntity = addNewDiscriminatedEntityAt(elementIndex, textBlockDiscriminant)
			saveTextElementAt(elementIndex, newEntity)
		}

		if (path.length > 1) {
			apply(operation)
			saveTextElementAt(topLevelIndex)
			return // We only care about top-level operations from here.
		}

		switch (operation.type) {
			case 'set_node':
				apply(operation)
				saveTextElementAt(topLevelIndex)
				break
			case 'merge_node': {
				apply(operation)
				removeElementAt(topLevelIndex)
				saveTextElementAt(topLevelIndex - 1)
				return
			}
			case 'split_node': {
				if (isContemberBlockElement(editor.children[topLevelIndex])) {
					throw new BindingError(`Cannot perform the '${operation.type}' operation on a contember block.`)
				}
				apply(operation)
				saveTextElementAt(topLevelIndex)
				addNewTextElementAt(topLevelIndex + 1)
				return
			}
			case 'insert_text':
			case 'remove_text': {
				const {
					path: [topLevelIndex],
				} = operation
				if (isContemberBlockElement(editor.children[topLevelIndex])) {
					throw new BindingError(`Cannot perform the '${operation.type}' operation on a contember block.`)
				}
				apply(operation)
				saveTextElementAt(topLevelIndex)
				return
			}

			case 'insert_node': {
				let { node } = operation
				if (!Element.isElement(node)) {
					throw new BindingError()
				}
				let blockType: FieldValue

				if (isContemberBlockElement(node)) {
					blockType = node.blockType
					const entity = addNewDiscriminatedEntityAt(topLevelIndex, blockType)
					apply(operation)
					// TODO cache?
					sortedEntities[topLevelIndex - firstContentIndex] = entity
				} else {
					apply(operation)
					addNewTextElementAt(topLevelIndex)
				}
				break
			}
			case 'remove_node': {
				apply(operation)
				removeElementAt(topLevelIndex)
				return
			}
			case 'move_node':
				// TODO Not even slate-react supports this at the moment
				apply(operation)
				break
		}
	})
}
