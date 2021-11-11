import { useCallback } from 'react'
import { Editor, Element as SlateElement, Transforms } from 'slate'
import {
	addEntityAtIndex,
	EntityAccessor,
	FieldValue, SugaredFieldProps,
	SugaredRelativeEntityList,
	useBindingOperations, useDesugaredRelativeEntityList, useDesugaredRelativeSingleField,
} from '@contember/binding'
import { prepareElementForInsertion } from '../utils'
import { ElementWithReference } from '../elements'
import { useGetParentEntityRef } from '../useGetParentEntityRef'
import { CreateElementReferences } from './useCreateElementReference'
import { SortedBlockRef } from '../state/useBlockEditorState'
import { BlockElementCache } from '../state/useBlockElementCache'
import { BlockElementPathRefs } from '../state/useBlockElementPathRefs'

export type InsertElementWithReference =(element: Omit<SlateElement, 'referenceId'>, referenceDiscriminant: FieldValue, initialize?: EntityAccessor.BatchUpdatesHandler) => void

export const useInsertElementWithReference = ({ editor, monolithicReferencesMode, blockList, sortableBy, createElementReference, sortedBlocksRef, contentField, blockElementCache, blockElementPathRefs }: {
	editor: Editor
	monolithicReferencesMode: boolean
	blockList: SugaredRelativeEntityList
	sortableBy: SugaredFieldProps['field']
	contentField: SugaredFieldProps['field']
	createElementReference: CreateElementReferences
	sortedBlocksRef: SortedBlockRef
	blockElementCache: BlockElementCache
	blockElementPathRefs: BlockElementPathRefs
}): InsertElementWithReference => {
	const bindingOperations = useBindingOperations()
	const getParentEntityRef = useGetParentEntityRef()
	const desugaredBlockList = useDesugaredRelativeEntityList(blockList)
	const sortableByField = useDesugaredRelativeSingleField(sortableBy)
	const blockContentField = useDesugaredRelativeSingleField(contentField)

	return useCallback(<Element extends SlateElement>(
			element: Omit<Element, 'referenceId'>,
			referenceDiscriminant: FieldValue,
			initialize?: EntityAccessor.BatchUpdatesHandler,
		) => {
		Editor.withoutNormalizing(editor, () => {
			const preppedPath = prepareElementForInsertion(editor, element as Element)
			const [topLevelElementIndex] = preppedPath
			const blockOrder = topLevelElementIndex
			let newBlockId: string | undefined = undefined

			if (preppedPath.length === 1 && !monolithicReferencesMode) {
				// We're creating a top-level block and aren't in monolithic mode.
				// Hence we need to first create the block entity.
				bindingOperations.batchDeferredUpdates(() => {
					getParentEntityRef.current().batchUpdates(getAccessor => {
						const blockList = getAccessor().getRelativeEntityList(desugaredBlockList)
						addEntityAtIndex(blockList, sortableByField, blockOrder, getNewBlock => {
							newBlockId = getNewBlock().id
							sortedBlocksRef.current.splice(blockOrder, 0, getNewBlock())
						})
					})
				})
			}
			const referenceId = createElementReference(editor, preppedPath, referenceDiscriminant, initialize).id
			const newNode: ElementWithReference = { ...(element as Element), referenceId }
			Transforms.insertNodes(editor, newNode, { at: preppedPath })

			if (preppedPath.length === 1 && !monolithicReferencesMode && newBlockId !== undefined) {
				bindingOperations.batchDeferredUpdates(() => {
					getParentEntityRef.current().batchUpdates(getAccessor => {
						const blockList = getAccessor().getRelativeEntityList(desugaredBlockList)

						blockElementPathRefs.set(
							newBlockId!,
							Editor.pathRef(editor, [topLevelElementIndex], { affinity: 'backward' }),
						)
						blockList
							.getChildEntityById(newBlockId!)
							.getRelativeSingleField(blockContentField)
							.updateValue(editor.serializeNodes([newNode]))
						blockElementCache.set(blockList.getChildEntityById(newBlockId!), newNode)
						sortedBlocksRef.current.splice(blockOrder, 1, blockList.getChildEntityById(newBlockId!))
					})
				})
			}
		})
	}, [bindingOperations, blockContentField, blockElementCache, blockElementPathRefs, createElementReference, desugaredBlockList, editor, getParentEntityRef, monolithicReferencesMode, sortableByField, sortedBlocksRef])
}
