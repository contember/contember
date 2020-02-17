import {
	addNewEntityAtIndex,
	BindingError,
	EntityAccessor,
	EntityListAccessor,
	FieldAccessor,
	FieldValue,
	RelativeEntityList,
	RelativeSingleField,
	RemovalType,
} from '@contember/binding'
import * as React from 'react'
import { Node as SlateNode, Editor, Element, Operation } from 'slate'
import { NormalizedBlock } from '../../../blocks'
import {
	contemberContentPlaceholderType,
	ContemberFieldElementPosition,
	isContemberBlockElement,
	isContemberContentPlaceholder,
	isContemberFieldElement,
} from '../elements'
import { NormalizedFieldBackedElement } from '../FieldBackedElement'
import { BlockSlateEditor } from './BlockSlateEditor'

export interface OverrideApplyOptions {
	batchUpdates: EntityAccessor['batchUpdates']
	desugaredEntityList: RelativeEntityList
	discriminationField: RelativeSingleField
	entityListAccessorRef: React.MutableRefObject<EntityListAccessor>
	fieldElementCache: WeakMap<FieldAccessor, Element>
	isMutatingRef: React.MutableRefObject<boolean>
	normalizedBlocksRef: React.MutableRefObject<NormalizedBlock[]>
	normalizedLeadingFieldsRef: React.MutableRefObject<NormalizedFieldBackedElement[]>
	normalizedTrailingFieldsRef: React.MutableRefObject<NormalizedFieldBackedElement[]>
	removalType: RemovalType
	sortableByField: RelativeSingleField
	sortedEntitiesRef: React.MutableRefObject<EntityAccessor[]>
	textBlockDiscriminant: FieldValue
	textBlockField: RelativeSingleField
	textElementCache: WeakMap<EntityAccessor, Element>
}

export const overrideApply = <E extends BlockSlateEditor>(editor: E, options: OverrideApplyOptions) => {
	const { apply } = editor
	const {
		batchUpdates,
		desugaredEntityList,
		discriminationField,
		fieldElementCache,
		normalizedLeadingFieldsRef,
		normalizedTrailingFieldsRef,
		removalType,
		sortableByField,
		sortedEntitiesRef,
		textBlockDiscriminant,
		textBlockField,
		textElementCache,
	} = options

	const fieldBackedElementRefs: {
		[Key in ContemberFieldElementPosition]: React.MutableRefObject<NormalizedFieldBackedElement[]>
	} = {
		leading: normalizedLeadingFieldsRef,
		trailing: normalizedTrailingFieldsRef,
	}

	editor.apply = (operation: Operation) => {
		if (operation.type === 'set_selection') {
			return apply(operation) // Nothing to do here
		}
		if (options.isMutatingRef.current) {
			return
		}
		// console.log('op', operation)
		if (operation.path.length === 0) {
			// Technically, the path could also be [], indicating that we're operating on the editor itself.
			// This is branch is entirely speculative. I *THINK* it could feasibly happen but I don't know when or how.
			return apply(operation) // ?!?!!???
		}

		batchUpdates(getAccessor => {
			const { path } = operation
			const [topLevelIndex] = path
			const firstContentIndex = options.normalizedLeadingFieldsRef.current.length
			let sortedEntities = sortedEntitiesRef.current

			// TODO also handle trailing
			const isLeadingElement = (elementIndex: number) => elementIndex < firstContentIndex
			const isTrailingElement = (elementIndex: number) =>
				elementIndex >= options.normalizedLeadingFieldsRef.current.length + sortedEntities.length
			const isFieldBackedElement = (elementIndex: number) =>
				isLeadingElement(elementIndex) || isTrailingElement(elementIndex)
			const getNormalizedFieldBackedElement = (elementIndex: number) => {
				const fieldBackedElement = editor.children[elementIndex]
				if (!isContemberFieldElement(fieldBackedElement)) {
					throw new BindingError(`Corrupted data`)
				}
				return fieldBackedElementRefs[fieldBackedElement.position].current[fieldBackedElement.index]
			}
			const getFreshFieldAccessor = (position: ContemberFieldElementPosition, normalizedFieldIndex: number) =>
				getAccessor().getRelativeSingleField(fieldBackedElementRefs[position].current[normalizedFieldIndex].field)
			const setFieldBackedElementValue = (
				position: keyof typeof fieldBackedElementRefs,
				normalizedFieldIndex: number,
				newValue: string,
			) => getFreshFieldAccessor(position, normalizedFieldIndex).updateValue?.(newValue)
			const getFreshContentEntityAccessor = (sortedEntityIndex: number): EntityAccessor => {
				const oldEntityKey = sortedEntities[sortedEntityIndex].getKey()
				const newEntity = getAccessor()
					.getRelativeEntityList(desugaredEntityList)
					.getByKey(oldEntityKey)
				if (!(newEntity instanceof EntityAccessor)) {
					throw new BindingError(`Corrupted data`)
				}
				return newEntity
			}
			const saveElementAt = (elementIndex: number, entity?: EntityAccessor) => {
				const targetElement = editor.children[elementIndex]
				if (!Element.isElement(targetElement)) {
					throw new BindingError(`Corrupted data`)
				}
				if (isLeadingElement(elementIndex) || isTrailingElement(elementIndex)) {
					const normalizedField = getNormalizedFieldBackedElement(elementIndex)
					const targetValue =
						normalizedField.format === 'editorJSON' ? JSON.stringify(targetElement) : SlateNode.string(targetElement)
					getAccessor()
						.getRelativeSingleField(normalizedField.field)
						.updateValue?.(targetValue)
					fieldElementCache.set(getAccessor().getRelativeSingleField(normalizedField.field), targetElement)
				} else {
					if (!entity) {
						entity = getFreshContentEntityAccessor(elementIndex - firstContentIndex)
					}
					entity.getRelativeSingleField(textBlockField).updateValue?.(JSON.stringify(targetElement))
					const sortedEntityIndex = elementIndex - firstContentIndex
					const updatedEntity = getFreshContentEntityAccessor(sortedEntityIndex)
					textElementCache.set(updatedEntity, targetElement)
					sortedEntities[sortedEntityIndex] = updatedEntity
				}
			}
			const removeElementAt = (elementIndex: number) => {
				if (isFieldBackedElement(elementIndex)) {
					setFieldBackedElementValue('leading', elementIndex, '')
				} else {
					const sortedEntityIndex = elementIndex - firstContentIndex
					sortedEntities[sortedEntityIndex].remove?.(removalType)
					sortedEntities.splice(sortedEntityIndex, 1)
				}
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
				saveElementAt(elementIndex, newEntity)
			}

			if (isContemberContentPlaceholder(editor.children[topLevelIndex])) {
				apply({
					type: 'set_node',
					path: [topLevelIndex],
					newProperties: {
						type: 'paragraph',
					},
					properties: {
						// Only `newProperties` are actually used but apparently, these have to be here too.
						type: 'paragraph',
					},
				})
				addNewTextElementAt(topLevelIndex)
			}

			if (path.length > 1) {
				apply(operation)
				saveElementAt(topLevelIndex)
			} else {
				switch (operation.type) {
					case 'set_node':
						apply(operation) // TODO for leading/trailing, if they're set to plaintext, do nothing here
						saveElementAt(topLevelIndex)
						break
					case 'merge_node': {
						// TODO special checks for leading/trailing
						apply(operation)
						removeElementAt(topLevelIndex)
						saveElementAt(topLevelIndex - 1)
						break
					}
					case 'split_node': {
						// TODO special checks for leading/trailing
						if (isContemberBlockElement(editor.children[topLevelIndex])) {
							throw new BindingError(`Cannot perform the '${operation.type}' operation on a contember block.`)
						}
						apply(operation)
						saveElementAt(topLevelIndex)
						addNewTextElementAt(topLevelIndex + 1)
						break
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
						break
					}

					case 'insert_node': {
						// TODO leading/trailing
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
						break
					}
					case 'move_node':
						// TODO Not even slate-react supports this at the moment
						apply(operation)
						break
				}
			}
			if (sortedEntities.length === 1) {
				const soleElement = editor.children[firstContentIndex] as Element

				if (editor.isParagraph(soleElement) && SlateNode.string(soleElement) === '') {
					apply({
						type: 'set_node',
						path: [firstContentIndex],
						newProperties: {
							type: contemberContentPlaceholderType,
						},
						properties: {
							// Only `newProperties` are actually used but apparently, these have to be here too.
							type: contemberContentPlaceholderType,
						},
					})
					removeElementAt(firstContentIndex)
				}
			}
		})
	}
}
