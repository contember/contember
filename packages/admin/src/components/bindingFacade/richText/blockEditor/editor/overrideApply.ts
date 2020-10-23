import {
	addEntityAtIndex,
	BindingError,
	EntityAccessor,
	FieldAccessor,
	GetEntityByKey,
	RelativeEntityList,
	RelativeSingleField,
	repairEntitiesOrder,
} from '@contember/binding'
import * as React from 'react'
import { Element as SlateElement, Node as SlateNode, Operation, Path as SlatePath } from 'slate'
import { ElementNode, TextNode } from '../../baseEditor'
import {
	ContemberContentPlaceholderElement,
	contemberContentPlaceholderType,
	ContemberFieldElement,
	ContemberFieldElementPosition,
} from '../elements'
import { NormalizedFieldBackedElement } from '../FieldBackedElement'
import { BlockSlateEditor } from './BlockSlateEditor'

export interface OverrideApplyOptions {
	batchUpdatesRef: React.MutableRefObject<EntityAccessor['batchUpdates']>
	blockContentField: RelativeSingleField
	blockElementCache: WeakMap<EntityAccessor, ElementNode>
	contemberFieldElementCache: WeakMap<FieldAccessor, ContemberFieldElement>
	desugaredBlockList: RelativeEntityList
	getEntityByKey: GetEntityByKey
	isMutatingRef: React.MutableRefObject<boolean>
	normalizedLeadingFieldsRef: React.MutableRefObject<NormalizedFieldBackedElement[]>
	placeholder: ContemberContentPlaceholderElement['placeholder']
	sortableByField: RelativeSingleField
	sortedBlocksRef: React.MutableRefObject<EntityAccessor[]>
}

export const overrideApply = <E extends BlockSlateEditor>(editor: E, options: OverrideApplyOptions) => {
	const { apply } = editor
	const {
		batchUpdatesRef,
		blockContentField,
		blockElementCache,
		contemberFieldElementCache,
		desugaredBlockList,
		getEntityByKey,
		isMutatingRef,
		normalizedLeadingFieldsRef,
		placeholder,
		sortableByField,
		sortedBlocksRef,
	} = options

	const fieldBackedElementRefs: {
		[Key in ContemberFieldElementPosition]: React.MutableRefObject<NormalizedFieldBackedElement[]>
	} = {
		leading: normalizedLeadingFieldsRef,
		//trailing: normalizedTrailingFieldsRef,
	}

	const firstContentIndex = normalizedLeadingFieldsRef.current.length
	//const firstContentElementPath = Editor.pathRef(editor, [firstContentIndex], {
	//	affinity: 'backward',
	//})

	editor.apply = (operation: Operation) => {
		if (operation.type === 'set_selection') {
			return apply(operation) // Nothing to do here
		}
		if (isMutatingRef.current || operation.path.length === 0) {
			return
		}

		batchUpdatesRef.current(getAccessor => {
			const { path } = operation
			const sortedTopLevelBlocks = sortedBlocksRef.current
			const [topLevelIndex] = path

			// TODO also handle trailing
			const isLeadingElement = (elementIndex: number) => elementIndex < firstContentIndex
			const isTrailingElement = (elementIndex: number) =>
				elementIndex >= normalizedLeadingFieldsRef.current.length + Math.max(sortedTopLevelBlocks.length, 1)
			const isFieldBackedElement = (elementIndex: number) =>
				isLeadingElement(elementIndex) || isTrailingElement(elementIndex)
			const getNormalizedFieldBackedElement = (elementIndex: number) => {
				const fieldBackedElement = editor.children[elementIndex]
				if (!editor.isContemberFieldElement(fieldBackedElement)) {
					throw new BindingError(`Corrupted data`)
				}
				return fieldBackedElementRefs[fieldBackedElement.position].current[fieldBackedElement.index]
			}
			const setTopLevelNode = (elementIndex: number, properties: object) => {
				apply({
					type: 'set_node',
					path: [elementIndex],
					newProperties: properties,
					properties,
				})
			}
			const getFreshFieldAccessor = (position: ContemberFieldElementPosition, normalizedFieldIndex: number) =>
				getAccessor().getRelativeSingleField(fieldBackedElementRefs[position].current[normalizedFieldIndex].field)
			const setFieldBackedElementValue = (
				position: keyof typeof fieldBackedElementRefs,
				normalizedFieldIndex: number,
				newValue: string,
			) => getFreshFieldAccessor(position, normalizedFieldIndex).updateValue(newValue)
			const getFreshContentEntityAccessor = (sortedEntityIndex: number): EntityAccessor => {
				const oldEntityKey = sortedTopLevelBlocks[sortedEntityIndex].key
				const newEntity = getAccessor().getRelativeEntityList(desugaredBlockList).getChildEntityByKey(oldEntityKey)
				if (!(newEntity instanceof EntityAccessor)) {
					throw new BindingError(`Corrupted data`)
				}
				return (sortedTopLevelBlocks[sortedEntityIndex] = newEntity)
			}
			const saveElementAt = (elementIndex: number, entity?: EntityAccessor) => {
				const targetElement = editor.children[elementIndex]
				if (!SlateElement.isElement(targetElement)) {
					throw new BindingError(`Corrupted data`)
				}
				if (editor.isContemberContentPlaceholderElement(targetElement)) {
					return
				}
				if (isLeadingElement(elementIndex) || isTrailingElement(elementIndex)) {
					if (!editor.isContemberFieldElement(targetElement)) {
						throw new BindingError()
					}
					const normalizedField = getNormalizedFieldBackedElement(elementIndex)
					const targetValue =
						normalizedField.format === 'editorJSON'
							? editor.serializeNodes(targetElement.children)
							: SlateNode.string(targetElement)
					getAccessor().getRelativeSingleField(normalizedField.field).updateValue(targetValue)
					contemberFieldElementCache.set(getAccessor().getRelativeSingleField(normalizedField.field), targetElement)
				} else {
					const sortedEntityIndex = elementIndex - firstContentIndex
					if (!entity) {
						entity = getFreshContentEntityAccessor(sortedEntityIndex)
					}
					entity.getRelativeSingleField(blockContentField).updateValue(editor.serializeNodes([targetElement]))
					const updatedEntity = getFreshContentEntityAccessor(sortedEntityIndex)
					blockElementCache.set(updatedEntity, targetElement)
				}
			}
			const purgeElementReferences = (element: ElementNode | TextNode) => {
				if (!SlateElement.isElement(element)) {
					return
				}
				if ('referenceId' in element && element.referenceId !== undefined) {
					const referencedEntity = getEntityByKey(element.referenceId)
					referencedEntity.deleteEntity()
				}
				for (const child of element.children) {
					purgeElementReferences(child)
				}
			}
			const removeElementAt = (elementIndex: number) => {
				if (isFieldBackedElement(elementIndex)) {
					setFieldBackedElementValue('leading', elementIndex, '')
				} else {
					const sortedEntityIndex = elementIndex - firstContentIndex
					sortedTopLevelBlocks[sortedEntityIndex].deleteEntity()
					sortedTopLevelBlocks.splice(sortedEntityIndex, 1)
					repairEntitiesOrder(sortableByField, sortedTopLevelBlocks)
				}
			}
			const addNewTopLevelBlockAt = (elementIndex: number) => {
				const normalizedElementIndex = Math.max(
					firstContentIndex,
					Math.min(elementIndex, sortedTopLevelBlocks.length + firstContentIndex),
				)
				const sortedEntityIndex = normalizedElementIndex - firstContentIndex
				addEntityAtIndex(
					getAccessor().getRelativeEntityList(desugaredBlockList),
					sortableByField,
					sortedEntityIndex,
					getNewEntity => {
						sortedTopLevelBlocks.splice(sortedEntityIndex, 0, getNewEntity())
					},
				)
				saveElementAt(elementIndex, sortedTopLevelBlocks[sortedEntityIndex])
			}

			if (editor.isContemberContentPlaceholderElement(editor.children[topLevelIndex])) {
				setTopLevelNode(topLevelIndex, {
					type: editor.defaultElementType,
					placeholder: null,
				})
				addNewTopLevelBlockAt(topLevelIndex)
			}

			// Some operations are simply illegal. Currently, we simply don't pass these through and don't call apply,
			// thereby essentially preventing them from happening. It is unclear whether that is the optimal approach
			// though. Alternatively, we could let them thorough and then perform an inverse operation or somehow
			// leverage normalization.
			// if (isLeadingElement(topLevelIndex)) {
			// 	// TODO trailing
			// 	const relevantField = normalizedLeadingFieldsRef.current[topLevelIndex]
			// 	if (relevantField.format === 'plainText') {
			// 		if (operation.type !== 'insert_text' && operation.type !== 'remove_text') {
			// 			return
			// 		}
			// 	} else if (relevantField.format === 'editorJSON') {
			// 		if (
			// 			operation.path.length === 1 && // Attempting to do something at the very top level. Ops inside are fine.
			// 			operation.type !== 'insert_text' &&
			// 			operation.type !== 'remove_text' &&
			// 			operation.type !== 'set_node'
			// 		) {
			// 			return
			// 		}
			// 	}
			// }

			// TODO: clone references when splitting nodes!!
			if (operation.type === 'remove_node') {
				purgeElementReferences(operation.node)
			} else if (operation.type === 'merge_node') {
				purgeElementReferences(SlateNode.get(editor, path))
			}

			apply(operation)

			if (path.length > 1 && operation.type !== 'move_node') {
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
						if (editor.isBlockVoidReferenceElement(editor.children[topLevelIndex])) {
							throw new BindingError(`Cannot perform the '${operation.type}' operation on a contember block.`)
						}
						if (isTrailingElement(topLevelIndex)) {
							break // TODO what do we even do from here?!
						}
						if (isLeadingElement(topLevelIndex)) {
							for (let i = topLevelIndex; i < firstContentIndex; i++) {
								setTopLevelNode(i, { index: i })
								saveElementAt(i)
							}
							setTopLevelNode(firstContentIndex, { type: editor.defaultElementType, index: null, position: null })
							addNewTopLevelBlockAt(firstContentIndex)
						} else {
							saveElementAt(topLevelIndex)
							addNewTopLevelBlockAt(topLevelIndex + 1)
						}
						break
					}
					case 'insert_text':
					case 'remove_text': {
						if (editor.isBlockVoidReferenceElement(editor.children[topLevelIndex])) {
							throw new BindingError(`Cannot perform the '${operation.type}' operation on a contember block.`)
						}
						saveElementAt(topLevelIndex)
						break
					}

					case 'insert_node': {
						// TODO leading/trailing
						let { node } = operation
						if (!SlateElement.isElement(node)) {
							throw new BindingError()
						}
						addNewTopLevelBlockAt(topLevelIndex)
						break
					}
					case 'remove_node': {
						// TODO for leading/trailing, this makes the state inconsistent
						// TODO remove the corresponding reference
						removeElementAt(topLevelIndex)
						break
					}
					case 'move_node': {
						// TODO prevent the target from being among leading/trailing
						const sourcePath = operation.path
						const targetPathBefore = operation.newPath
						const targetPathAfter = SlatePath.transform(operation.path, operation)!

						const sourceTopLevelIndex = sourcePath[0]
						const targetPathBeforeTopLevelIndex = targetPathBefore[0]
						const targetPathAfterTopLevelIndex = targetPathAfter[0]

						if (sourceTopLevelIndex === targetPathBeforeTopLevelIndex) {
							if (targetPathAfter.length === 1) {
								addNewTopLevelBlockAt(sourceTopLevelIndex)
								saveElementAt(sourceTopLevelIndex + 1)
							} else {
								saveElementAt(sourceTopLevelIndex)
							}
						} else {
							if (sourcePath.length === 1) {
								removeElementAt(sourceTopLevelIndex)
							} else {
								saveElementAt(sourceTopLevelIndex)
							}
							if (targetPathAfter.length === 1) {
								addNewTopLevelBlockAt(targetPathAfterTopLevelIndex)
							} else {
								saveElementAt(targetPathAfterTopLevelIndex)
							}
						}
						break
					}
				}
			}
			if (sortedTopLevelBlocks.length === 1) {
				const soleElement = editor.children[firstContentIndex] as SlateElement

				if (editor.isDefaultElement(soleElement) && SlateNode.string(soleElement) === '') {
					setTopLevelNode(firstContentIndex, {
						type: contemberContentPlaceholderType,
						placeholder,
					})
					removeElementAt(firstContentIndex)
				}
			}
		})
	}
}
