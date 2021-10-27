import type { EntityAccessor, EntityListAccessor, RelativeEntityList, RelativeSingleField } from '@contember/binding'
import type { MutableRefObject } from 'react'
import { Editor, Element, Element as SlateElement, PathRef } from 'slate'
import { assertNever } from '../../../../../utils'
import type { BlockSlateEditor } from './BlockSlateEditor'

export interface OverrideOnChangeOptions {
	blockContentField: RelativeSingleField
	blockElementCache: WeakMap<EntityAccessor, SlateElement>
	blockElementPathRefs: Map<string, PathRef>
	desugaredBlockList: RelativeEntityList
	getParentEntityRef: MutableRefObject<EntityAccessor.GetEntityAccessor>
	sortableByField: RelativeSingleField
	sortedBlocksRef: MutableRefObject<EntityAccessor[]>
}

export const overrideSlateOnChange = <E extends BlockSlateEditor>(
	editor: E,
	{
		blockContentField,
		blockElementCache,
		blockElementPathRefs,
		desugaredBlockList,
		getParentEntityRef,
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

		const topLevelBlocks = sortedBlocksRef.current

		if (hasTextOperation && !hasNodeOperation && topLevelBlocks.length > 0) {
			// Fast path: we're just typing and need to at most update top-level blocks. Typically just one though.
			return getParentEntityRef.current().batchUpdates(getEntity => {
				for (const operation of operations) {
					switch (operation.type) {
						case 'insert_text':
						case 'remove_text': {
							const [topLevelIndex] = operation.path
							saveBlockElement(
								getEntity().getRelativeEntityList(desugaredBlockList).getAccessor,
								topLevelBlocks[topLevelIndex].id,
								children[topLevelIndex] as Element,
							)
						}
					}
				}
				return slateOnChange()
			})
		}

		return getParentEntityRef.current().batchUpdates(getAccessor => {
			const processedAccessors: Array<true | undefined> = Array.from({
				length: editor.children.length,
			})
			const blockList = getAccessor().getRelativeEntityList(desugaredBlockList)
			const getBlockList = blockList.getAccessor

			for (const [blockId, pathRef] of blockElementPathRefs) {
				const current = pathRef.current
				const originalBlock = getBlockList().getChildEntityById(blockId)
				const cleanUp = () => {
					originalBlock.deleteEntity()
					pathRef.unref()
					blockElementPathRefs.delete(blockId)
				}

				if (current === null || current.length > 1) {
					cleanUp()
				} else {
					const newBlockIndex = current[0]

					const newBlockOrder = newBlockIndex

					if (processedAccessors[newBlockOrder]) {
						// This path has already been processed. This happens when nodes get merged.
						cleanUp()
					} else {
						const originalElement = blockElementCache.get(originalBlock)
						const currentElement = editor.children[newBlockIndex]

						if (
							originalElement !== currentElement ||
							originalBlock.getRelativeSingleField(sortableByField).value !== newBlockOrder
						) {
							getBlockList()
								.getChildEntityById(blockId)
								.getRelativeSingleField(sortableByField)
								.updateValue(newBlockOrder)
							saveBlockElement(getBlockList, blockId, currentElement as Element)
						}
						processedAccessors[newBlockOrder] = true
					}
				}
			}

			for (const [topLevelIndex, child] of editor.children.entries()) {
				const blockOrder = topLevelIndex
				const isProcessed = processedAccessors[blockOrder]
				if (!isProcessed) {
					blockList.createNewEntity(getAccessor => {
						const newId = getAccessor().id
						getAccessor().getRelativeSingleField(sortableByField).updateValue(blockOrder)
						saveBlockElement(getBlockList, newId, child as Element)
						blockElementPathRefs.set(newId, Editor.pathRef(editor, [topLevelIndex], { affinity: 'backward' }))
					})
				}
			}

			return slateOnChange()
		})
	}

	const saveBlockElement = (getBlockList: () => EntityListAccessor, id: string, element: Element) => {
		getBlockList()
			.getChildEntityById(id)
			.getRelativeSingleField(blockContentField)
			.updateValue(editor.serializeNodes([element]))
		blockElementCache.set(getBlockList().getChildEntityById(id), element)
	}
}
