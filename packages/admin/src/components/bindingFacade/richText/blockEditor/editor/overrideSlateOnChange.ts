import {
	EntityAccessor,
	EntityListAccessor,
	FieldAccessor,
	RelativeEntityList,
	RelativeSingleField,
} from '@contember/binding'
import { MutableRefObject } from 'react'
import { Editor, Node as SlateNode, PathRef } from 'slate'
import { assertNever } from '../../../../../utils'
import { EditorNode, ElementNode } from '../../baseEditor'
import { ContemberFieldElement } from '../elements'
import { FieldBackedElement } from '../FieldBackedElement'
import { BlockSlateEditor } from './BlockSlateEditor'

export interface OverrideOnChangeOptions {
	batchUpdatesRef: MutableRefObject<EntityAccessor.BatchUpdates>
	blockContentField: RelativeSingleField
	blockElementCache: WeakMap<EntityAccessor, ElementNode>
	blockElementPathRefs: Map<string, PathRef>
	contemberFieldElementCache: WeakMap<FieldAccessor<string>, ContemberFieldElement>
	desugaredBlockList: RelativeEntityList
	leadingFields: FieldBackedElement[]
	trailingFields: FieldBackedElement[]
	sortableByField: RelativeSingleField
	sortedBlocksRef: MutableRefObject<EntityAccessor[]>
}

export const overrideSlateOnChange = <E extends BlockSlateEditor>(
	editor: E,
	{
		batchUpdatesRef,
		blockContentField,
		blockElementCache,
		blockElementPathRefs,
		contemberFieldElementCache,
		desugaredBlockList,
		leadingFields,
		trailingFields,
		sortableByField,
		sortedBlocksRef,
	}: OverrideOnChangeOptions,
) => {
	const { slateOnChange } = editor

	editor.slateOnChange = () => {
		const { children, operations } = editor

		let hasSelectionOperation = false
		let hasTextOperation = false
		let hasNodeOperation = false

		for (const operation of operations) {
			switch (operation.type) {
				case 'set_selection':
					hasSelectionOperation = true
					break
				case 'insert_text':
				case 'remove_text':
					hasTextOperation = true
					break
				case 'insert_node':
				case 'merge_node':
				case 'move_node':
				case 'remove_node':
				case 'set_node':
				case 'split_node':
					hasNodeOperation = true
					break
				default:
					return assertNever(operation)
			}
		}

		if (hasSelectionOperation && !hasTextOperation && !hasNodeOperation) {
			// Fast path: we're just moving the caret. Nothing to do from here.
			return slateOnChange()
		}

		const leadingCount = leadingFields.length
		const trailingCount = trailingFields.length

		const topLevelBlocks = sortedBlocksRef.current

		const isLeadingElement = (elementIndex: number) => elementIndex < leadingCount
		const isTrailingElement = (elementIndex: number) => elementIndex >= editor.children.length - trailingCount

		if (hasTextOperation && !hasNodeOperation) {
			// Fast path: we're just typing and need to at most update top-level blocks. Typically just one though.
			// TODO nested leading/trailing will complicate this.

			return batchUpdatesRef.current(getEntity => {
				for (const operation of operations) {
					switch (operation.type) {
						case 'insert_text':
						case 'remove_text': {
							const [topLevelIndex] = operation.path
							if (isLeadingElement(topLevelIndex)) {
								saveFieldBackedElement(
									getEntity,
									leadingFields[topLevelIndex],
									children[topLevelIndex] as ContemberFieldElement,
								)
							} else if (isTrailingElement(topLevelIndex)) {
								saveFieldBackedElement(
									getEntity,
									trailingFields[topLevelIndex],
									children[topLevelIndex] as ContemberFieldElement,
								)
							} else {
								// This is a block
								const getBlockById = getEntity().getRelativeEntityList(desugaredBlockList).getChildEntityById
								saveBlockElement(
									getBlockById,
									topLevelBlocks[topLevelIndex - leadingCount].id,
									children[topLevelIndex] as EditorNode,
								)
							}
						}
					}
				}
				return slateOnChange()
			})
		}

		return batchUpdatesRef.current(getAccessor => {
			const processedAccessors: Array<true | undefined> = Array.from({
				length: editor.children.length - leadingCount - trailingCount,
			})
			const blockList = getAccessor().getRelativeEntityList(desugaredBlockList)
			const getBlockById = blockList.getChildEntityById

			for (const [blockId, pathRef] of blockElementPathRefs) {
				const current = pathRef.current
				const originalBlock = getBlockById(blockId)
				const cleanUp = () => {
					originalBlock.deleteEntity()
					pathRef.unref()
					blockElementPathRefs.delete(blockId)
				}

				if (current === null || current.length > 1) {
					cleanUp()
				} else {
					const newBlockIndex = current[0]

					if (isLeadingElement(newBlockIndex) || isTrailingElement(newBlockIndex)) {
						cleanUp()
					} else {
						const newBlockOrder = newBlockIndex - leadingCount

						if (processedAccessors[newBlockOrder]) {
							// This path has already been processed. This happens when nodes get merged.
							cleanUp()
						} else {
							const originalElement = blockElementCache.get(originalBlock)
							const currentElement = editor.children[newBlockIndex] as EditorNode

							if (
								originalElement !== currentElement ||
								originalBlock.getRelativeSingleField(sortableByField).value !== newBlockOrder
							) {
								getBlockById(blockId).getRelativeSingleField(sortableByField).updateValue(newBlockOrder)
								saveBlockElement(getBlockById, blockId, currentElement)
							}
							processedAccessors[newBlockOrder] = true
						}
					}
				}
			}

			for (const [topLevelIndex, child] of editor.children.entries()) {
				if (isLeadingElement(topLevelIndex)) {
					saveFieldBackedElement(
						getAccessor,
						leadingFields[topLevelIndex],
						children[topLevelIndex] as ContemberFieldElement,
					)
				} else if (isTrailingElement(topLevelIndex)) {
					saveFieldBackedElement(
						getAccessor,
						trailingFields[topLevelIndex],
						children[topLevelIndex] as ContemberFieldElement,
					)
				} else if (editor.isContemberContentPlaceholderElement(child)) {
					// Do nothing
				} else {
					const blockOrder = topLevelIndex - leadingCount
					const isProcessed = processedAccessors[blockOrder]
					if (!isProcessed) {
						blockList.createNewEntity(getAccessor => {
							const newId = getAccessor().id
							getAccessor().getRelativeSingleField(sortableByField).updateValue(blockOrder)
							saveBlockElement(getBlockById, newId, child as EditorNode)
							blockElementPathRefs.set(newId, Editor.pathRef(editor, [topLevelIndex], { affinity: 'backward' }))
						})
					}
				}
			}

			return slateOnChange()
		})
	}

	const saveFieldBackedElement = (
		getParentEntity: EntityAccessor.GetEntityAccessor,
		fieldBackedElement: FieldBackedElement,
		editorElement: ContemberFieldElement,
	) => {
		const targetField = getParentEntity().getField(fieldBackedElement.field)
		const bareValue =
			fieldBackedElement.format === 'richText'
				? editor.serializeNodes(editorElement.children)
				: SlateNode.string(editorElement)
		const targetValue = !bareValue && targetField.valueOnServer === null ? null : bareValue

		targetField.updateValue(targetValue)
		contemberFieldElementCache.set(getParentEntity().getField(fieldBackedElement.field), editorElement)
	}

	const saveBlockElement = (getBlockById: EntityListAccessor.GetChildEntityById, id: string, element: EditorNode) => {
		getBlockById(id)
			.getRelativeSingleField(blockContentField)
			.updateValue(editor.serializeNodes([element]))
		blockElementCache.set(getBlockById(id), element)
	}
}
