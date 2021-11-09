import { MutableRefObject, useCallback } from 'react'
import { assertNever } from '../../../../../utils'
import { Editor, Element } from 'slate'
import {
	EntityAccessor,
	EntityListAccessor,
	SugaredFieldProps, SugaredRelativeEntityList, useDesugaredRelativeEntityList,
	useDesugaredRelativeSingleField,
} from '@contember/binding'
import { useGetParentEntityRef } from '../useGetParentEntityRef'
import { BlockElementCache } from './useBlockElementCache'
import { BlockElementPathRefs } from './useBlockElementPathRefs'

export const useBlockEditorOnChange = ({ editor, sortedBlocksRef, sortableBy, contentField, blockList, blockElementCache, blockElementPathRefs }: {
	editor: Editor,
	sortedBlocksRef: MutableRefObject<EntityAccessor[]>,
	contentField: SugaredFieldProps['field'],
	sortableBy: SugaredFieldProps['field'],
	blockList: SugaredRelativeEntityList,
	blockElementCache: BlockElementCache,
	blockElementPathRefs: BlockElementPathRefs
}) => {

	const getParentEntityRef = useGetParentEntityRef()
	const desugaredBlockList = useDesugaredRelativeEntityList(blockList)
	const desugaredBlockContentField = useDesugaredRelativeSingleField(contentField)
	const desugaredSortableByField = useDesugaredRelativeSingleField(sortableBy)

	return useCallback(() => {
		const { children, operations } = editor
		const saveBlockElement = (getBlockList: () => EntityListAccessor, id: string, element: Element) => {
			getBlockList()
				.getChildEntityById(id)
				.getRelativeSingleField(desugaredBlockContentField)
				.updateValue(editor.serializeNodes([element]))
			blockElementCache.set(getBlockList().getChildEntityById(id), element)
		}

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
			return
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
				return
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
							originalBlock.getRelativeSingleField(desugaredSortableByField).value !== newBlockOrder
						) {
							getBlockList()
								.getChildEntityById(blockId)
								.getRelativeSingleField(desugaredSortableByField)
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
						getAccessor().getRelativeSingleField(desugaredSortableByField).updateValue(blockOrder)
						saveBlockElement(getBlockList, newId, child as Element)
						blockElementPathRefs.set(newId, Editor.pathRef(editor, [topLevelIndex], { affinity: 'backward' }))
					})
				}
			}

			return
		})
	}, [blockElementCache, blockElementPathRefs, desugaredBlockContentField, desugaredBlockList, desugaredSortableByField, editor, getParentEntityRef, sortedBlocksRef])
}
