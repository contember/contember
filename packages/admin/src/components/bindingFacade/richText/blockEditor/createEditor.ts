import {
	addNewEntityAtIndex,
	BindingError,
	EntityAccessor,
	EntityListAccessor,
	FieldValue,
	RelativeSingleField,
	RemovalType,
	sortEntities,
} from '@contember/binding'
import * as React from 'react'
import { Element, Operation } from 'slate'
import { createEditorWithEssentials, withAnchors, withBasicFormatting, withParagraphs } from '../plugins'
import { contemberBlockElementType, isContemberBlockElement } from './ContemberBlockElement'

export interface CreateEditorOptions {
	entityListRef: React.MutableRefObject<EntityListAccessor>
	isMutatingRef: React.MutableRefObject<boolean>
	sortedEntitiesRef: React.MutableRefObject<EntityAccessor[]>
	textBlockDiscriminant: FieldValue
	discriminationField: RelativeSingleField
	sortableByField: RelativeSingleField
	textBlockField: RelativeSingleField
	elementCache: WeakMap<EntityAccessor, Element>
	removalType: RemovalType
}

export const createEditor = (options: CreateEditorOptions) => {
	// TODO configurable plugin set
	const editor = withParagraphs(withAnchors(withBasicFormatting(createEditorWithEssentials())))

	const { isVoid, apply } = editor

	editor.isVoid = element => {
		if (element.type === contemberBlockElementType) {
			return true
		}
		return isVoid(element)
	}
	editor.apply = (operation: Operation) => {
		console.log(operation)
		if (options.isMutatingRef.current) {
			return
		}

		const entityList = options.entityListRef.current
		let sortedEntities = options.sortedEntitiesRef.current

		const {
			discriminationField,
			elementCache,
			removalType,
			sortableByField,
			textBlockDiscriminant,
			textBlockField,
		} = options

		entityList.batchUpdates?.(getAccessor => {
			const saveElementAt = (index: number) => {
				const oldEntityKey = sortedEntities[index].getKey()
				const newEntity = getAccessor().entities.find(entity => entity?.getKey() === oldEntityKey)
				if (!(newEntity instanceof EntityAccessor)) {
					console.log('WTF?', newEntity)
					throw new BindingError(`WHAAAT?!`)
				}
				const targetElement = editor.children[index]

				if (!Element.isElement(targetElement)) {
					throw new BindingError(`Corrupted data`)
				}
				elementCache.set(newEntity, targetElement)
				newEntity.getRelativeSingleField(textBlockField).updateValue?.(JSON.stringify(targetElement))
			}
			const refreshSortedEntities = () => {
				sortedEntities = sortEntities(getAccessor().getFilteredEntities(), sortableByField)
			}

			if (operation.type === 'set_selection') {
				return apply(operation) // Nothing to do here
			}

			const { path } = operation
			const [topLevelIndex] = path

			if (path.length > 1) {
				apply(operation)
				saveElementAt(topLevelIndex)
				return // We only care about top-level operations from here.
			}

			switch (operation.type) {
				case 'set_node':
					apply(operation)
					break
				case 'merge_node': {
					apply(operation)
					sortedEntities[topLevelIndex].remove?.(removalType)
					sortedEntities.splice(topLevelIndex, 1)
					saveElementAt(topLevelIndex - 1)
					return
				}
				case 'split_node': {
					if (isContemberBlockElement(editor.children[topLevelIndex])) {
						throw new BindingError(`Cannot perform the '${operation.type}' operation on a contember block.`)
					}
					apply(operation)
					saveElementAt(topLevelIndex)
					const newSortedIndex = topLevelIndex + 1

					addNewEntityAtIndex(getAccessor(), sortableByField, newSortedIndex, (getInnerAccessor, newEntityIndex) => {
						const newEntity = getInnerAccessor().entities[newEntityIndex] as EntityAccessor
						newEntity.getRelativeSingleField(discriminationField).updateValue?.(textBlockDiscriminant)
						sortedEntities[newSortedIndex] = getInnerAccessor().entities[newEntityIndex] as EntityAccessor
					})
					refreshSortedEntities()
					saveElementAt(newSortedIndex)
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
					saveElementAt(topLevelIndex)
					return
				}

				case 'insert_node': {
					apply(operation) // TODO
					break
				}
				case 'remove_node': {
					sortedEntities[topLevelIndex].remove?.(removalType)
					sortedEntities.splice(topLevelIndex, 1)
					return
				}
				case 'move_node':
					// TODO Not even slate-react supports this at the moment
					apply(operation)
					break
			}
			console.log('afterOp', sortedEntities)
		})
	}

	return editor
}
