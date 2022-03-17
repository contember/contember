import { MutableRefObject, useCallback } from 'react'
import { assertNever } from '../../../../../utils'
import { Editor, Element, Operation } from 'slate'
import {
	EntityAccessor,
	EntityId,
	EntityListAccessor,
	SugaredFieldProps,
	SugaredRelativeEntityList,
	useDesugaredRelativeEntityList,
	useDesugaredRelativeSingleField,
} from '@contember/binding'
import { useGetParentEntityRef } from '../useGetParentEntityRef'
import { BlockElementCache } from './useBlockElementCache'

export const useBlockEditorOnChange = ({ refreshBlocks, editor, sortedBlocksRef, contentField, blockList, blockElementCache }: {
	editor: Editor,
	sortedBlocksRef: MutableRefObject<EntityAccessor[]>,
	contentField: SugaredFieldProps['field'],
	blockList: SugaredRelativeEntityList,
	blockElementCache: BlockElementCache,
	refreshBlocks: () => void
}) => {

	const getParentEntityRef = useGetParentEntityRef()
	const desugaredBlockList = useDesugaredRelativeEntityList(blockList)
	const desugaredBlockContentField = useDesugaredRelativeSingleField(contentField)


	return useCallback(() => {
		const { children, operations } = editor
		const saveBlockElement = (getBlockList: () => EntityListAccessor, id: EntityId, element: Element) => {
			getBlockList()
				.getChildEntityById(id)
				.getRelativeSingleField(desugaredBlockContentField)
				.updateValue(editor.serializeNodes([element]))
			blockElementCache.set(getBlockList().getChildEntityById(id), element)
		}
		const operationsType = getTypeOfOperations(operations)

		if (operationsType === 'selection') {
			// Fast path: we're just moving the caret. Nothing to do from here.
			return
		}

		const topLevelBlocks = sortedBlocksRef.current

		if (operationsType === 'text' && topLevelBlocks.length > 0) {
			// Fast path: we're just typing and need to at most update top-level blocks. Typically just one though.
			return getParentEntityRef.current().batchUpdates(getEntity => {
				for (const operation of operations) {
					switch (operation.type) {
						case 'insert_text':
						case 'remove_text':
							const [topLevelIndex] = operation.path
							saveBlockElement(
								getEntity().getRelativeEntityList(desugaredBlockList).getAccessor,
								topLevelBlocks[topLevelIndex].id,
								children[topLevelIndex] as Element,
							)
							break
					}
				}
			})
		} else {
			refreshBlocks()
		}

	}, [blockElementCache, desugaredBlockContentField, desugaredBlockList, editor, getParentEntityRef, refreshBlocks, sortedBlocksRef])
}

const getTypeOfOperations = (operations: Operation[]): 'selection' | 'text' | 'node' => {
	let hasTextOperation = false
	for (const operation of operations) {
		switch (operation.type) {
			case 'set_selection':
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
				return 'node'
			default:
				return assertNever(operation)
		}
	}
	return hasTextOperation ? 'text' : 'selection'
}
