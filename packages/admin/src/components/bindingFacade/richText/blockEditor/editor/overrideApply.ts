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
	isContemberContentPlaceholderElement,
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

	const firstContentIndex = options.normalizedLeadingFieldsRef.current.length
	//const firstContentElementPath = Editor.pathRef(editor, [firstContentIndex], {
	//	affinity: 'backward',
	//})

	editor.apply = (operation: Operation) => {
		if (operation.type === 'set_selection') {
			return apply(operation) // Nothing to do here
		}
		if (options.isMutatingRef.current) {
			return
		}
		//console.log('op', operation, firstContentElementPath.current)
		if (operation.path.length === 0) {
			// This is invalid.
			return
		}

		batchUpdates(getAccessor => {
			const { path } = operation
			const sortedEntities = sortedEntitiesRef.current
			const [topLevelIndex] = path

			// TODO also handle trailing
			const isLeadingElement = (elementIndex: number) => elementIndex < firstContentIndex
			const isTrailingElement = (elementIndex: number) =>
				elementIndex >= options.normalizedLeadingFieldsRef.current.length + Math.max(sortedEntities.length, 1)
			const isFieldBackedElement = (elementIndex: number) =>
				isLeadingElement(elementIndex) || isTrailingElement(elementIndex)
			const getNormalizedFieldBackedElement = (elementIndex: number) => {
				const fieldBackedElement = editor.children[elementIndex]
				if (!isContemberFieldElement(fieldBackedElement)) {
					throw new BindingError(`Corrupted data`)
				}
				return fieldBackedElementRefs[fieldBackedElement.position].current[fieldBackedElement.index]
			}
			const setTopLevelElementType = (elementIndex: number, type: string) => {
				apply({
					type: 'set_node',
					path: [elementIndex],
					newProperties: { type },
					properties: { type },
				})
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
					const sortedEntityIndex = elementIndex - firstContentIndex
					if (!entity) {
						entity = getFreshContentEntityAccessor(sortedEntityIndex)
					}
					entity.getRelativeSingleField(textBlockField).updateValue?.(JSON.stringify(targetElement))
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
				const normalizedElementIndex = Math.max(
					firstContentIndex,
					Math.min(elementIndex, sortedEntities.length + firstContentIndex),
				)
				const sortedEntityIndex = normalizedElementIndex - firstContentIndex
				addNewEntityAtIndex(
					getAccessor().getRelativeEntityList(desugaredEntityList),
					sortableByField,
					sortedEntityIndex,
					(getInnerAccessor, newEntityIndex) => {
						const newEntity = getInnerAccessor().entities[newEntityIndex] as EntityAccessor
						newEntity.getRelativeSingleField(discriminationField).updateValue?.(blockDiscriminant)
						sortedEntities.splice(sortedEntityIndex, 0, getInnerAccessor().entities[newEntityIndex] as EntityAccessor)
					},
				)
				return sortedEntities[sortedEntityIndex]
			}
			const addNewTextElementAt = (elementIndex: number) => {
				const newEntity = addNewDiscriminatedEntityAt(elementIndex, textBlockDiscriminant)
				saveElementAt(elementIndex, newEntity)
			}

			if (isContemberContentPlaceholderElement(editor.children[topLevelIndex])) {
				setTopLevelElementType(topLevelIndex, 'paragraph')
				addNewTextElementAt(topLevelIndex)
			}
			apply(operation)

			if (path.length > 1) {
				saveElementAt(topLevelIndex)
			} else {
				switch (operation.type) {
					case 'set_node':
						// TODO for leading/trailing, if they're set to plaintext, do nothing here
						saveElementAt(topLevelIndex)
						break
					case 'merge_node': {
						// TODO special checks for leading/trailing
						removeElementAt(topLevelIndex)
						saveElementAt(topLevelIndex - 1)
						break
					}
					case 'split_node': {
						// TODO special checks for leading/trailing
						if (isContemberBlockElement(editor.children[topLevelIndex])) {
							throw new BindingError(`Cannot perform the '${operation.type}' operation on a contember block.`)
						}
						if (isTrailingElement(topLevelIndex)) {
							break // TODO what do we even do from here?!
						}
						if (isLeadingElement(topLevelIndex)) {
							for (let i = topLevelIndex; i < firstContentIndex; i++) {
								apply({
									type: 'set_node',
									path: [i],
									newProperties: { index: i },
									properties: { index: i },
								})
								saveElementAt(i)
							}
							apply({
								type: 'set_node',
								path: [firstContentIndex],
								newProperties: { type: 'paragraph', index: null, position: null },
								properties: { type: 'paragraph', index: null, position: null },
							})
							addNewTextElementAt(firstContentIndex)
						} else {
							saveElementAt(topLevelIndex)
							addNewTextElementAt(topLevelIndex + 1)
						}
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
							// TODO cache?
							sortedEntities[topLevelIndex - firstContentIndex] = addNewDiscriminatedEntityAt(topLevelIndex, blockType)
						} else {
							addNewTextElementAt(topLevelIndex)
						}
						break
					}
					case 'remove_node': {
						// TODO for leading/trailing, this makes the state inconsistent
						removeElementAt(topLevelIndex)
						break
					}
					case 'move_node':
						// TODO Not even slate-react supports this at the moment
						break
				}
				if (sortedEntities.length === 1) {
					const soleElement = editor.children[firstContentIndex] as Element

					if (editor.isParagraph(soleElement) && SlateNode.string(soleElement) === '') {
						setTopLevelElementType(firstContentIndex, contemberContentPlaceholderType)
						removeElementAt(firstContentIndex)
					}
				}
			}
		})
	}
}
