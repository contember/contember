import {
	BindingError,
	EntityAccessor,
	EntityId,
	EntityListAccessor,
	SugaredFieldProps,
	SugaredRelativeEntityList,
	useDesugaredRelativeEntityList,
	useDesugaredRelativeSingleField,
	useEntityBeforePersist,
} from '@contember/react-binding'
import { Descendant, Editor, Element as SlateElement, Element } from 'slate'
import { isElementWithReference } from '../elements'
import { useGetParentEntityRef } from '../useGetParentEntityRef'
import { MutableRefObject, useCallback } from 'react'
import { BlockElementCache } from './useBlockElementCache'
import { BlockElementPathRefs } from './useBlockElementPathRefs'
import { isInitialSlateState } from '../utils/isInitialSlateState'


export type RefreshBlocks = (args?: { forceInitialBlock?: boolean }) => void

export const useRefreshBlocks = ({ editor, sortedBlocksRef, sortableBy, contentField, blockList, blockElementCache, blockElementPathRefs, referencesField, monolithicReferencesMode, trashFakeBlockId }: {
	editor: Editor
	sortedBlocksRef: MutableRefObject<EntityAccessor[]>
	contentField: SugaredFieldProps['field']
	sortableBy: SugaredFieldProps['field']
	blockList: SugaredRelativeEntityList
	blockElementCache: BlockElementCache
	blockElementPathRefs: BlockElementPathRefs
	referencesField?: SugaredRelativeEntityList | string
	monolithicReferencesMode?: boolean
	trashFakeBlockId: MutableRefObject<EntityId | undefined>
}) => {
	const desugaredBlockList = useDesugaredRelativeEntityList(blockList)
	const desugaredBlockContentField = useDesugaredRelativeSingleField(contentField)
	const desugaredSortableByField = useDesugaredRelativeSingleField(sortableBy)
	const getParentEntityRef = useGetParentEntityRef()
	useEntityBeforePersist(() => {
		if (trashFakeBlockId.current) {
			const block = getParentEntityRef.current().getEntityList(desugaredBlockList).getChildEntityById(trashFakeBlockId.current)
			block.deleteEntity()
			trashFakeBlockId.current = undefined
		}
	})

	return useCallback<RefreshBlocks>((args = {}) => {
		const { children } = editor
		const saveBlockElement = (getBlockList: () => EntityListAccessor, id: EntityId, element: Element) => {
			getBlockList()
				.getChildEntityById(id)
				.getField(desugaredBlockContentField)
				.updateValue(editor.serializeNodes([element]))
			blockElementCache.set(getBlockList().getChildEntityById(id), element)
		}
		getParentEntityRef.current().batchUpdates(getAccessor => {
			const processedAccessors: Array<EntityAccessor | undefined> = Array.from({
				length: editor.children.length,
			})
			const blockList = getAccessor().getEntityList(desugaredBlockList)
			if (blockList.length === 0 && isInitialSlateState(editor.children) && !args.forceInitialBlock) {
				return
			}
			const getBlockList = blockList.getAccessor

			let cleanupStack = () => {
			}
			const knownReferences = new Map<EntityId, [reference: EntityAccessor, block: EntityAccessor]>()

			for (const [blockId, pathRef] of blockElementPathRefs) {
				const current = pathRef.current
				const blockList = getBlockList()
				const block = blockList.hasEntityId(blockId) ? blockList.getChildEntityById(blockId) : null
				if (block && !monolithicReferencesMode && referencesField) {
					for (const reference of block.getEntityList(referencesField)) {
						knownReferences.set(reference.id, [reference, block])
					}
				}
				const cleanUp = () => {
					const prev = cleanupStack
					cleanupStack = () => {
						prev()
						block?.deleteEntity()
						pathRef.unref()
						blockElementPathRefs.delete(blockId)
					}
				}

				if (current === null || current.length > 1 || block === null) {
					cleanUp()
				} else {
					const newBlockOrder = current[0]

					if (processedAccessors[newBlockOrder]) {
						// This path has already been processed. This happens when nodes get merged.
						cleanUp()
					} else {
						const originalElement = blockElementCache.get(block)
						const currentElement = editor.children[newBlockOrder]
						if (
							originalElement !== currentElement ||
							block.getField(desugaredSortableByField).value !== newBlockOrder
						) {
							block
								.getField(desugaredSortableByField)
								.updateValue(newBlockOrder)
							saveBlockElement(getBlockList, blockId, currentElement as Element)
						}
						processedAccessors[newBlockOrder] = block
					}
				}
			}

			for (const [topLevelIndex, child] of editor.children.entries()) {
				const blockOrder = topLevelIndex
				const isProcessed = processedAccessors[blockOrder]
				if (!isProcessed) {
					const id = blockList.createNewEntity(getAccessor => {
						const newId = getAccessor().id
						getAccessor().getField(desugaredSortableByField).updateValue(blockOrder)
						saveBlockElement(getBlockList, newId, child as Element)
						blockElementPathRefs.set(newId, Editor.pathRef(editor, [topLevelIndex], { affinity: 'backward' }))
					})
					processedAccessors[blockOrder] = blockList.getChildEntityById(id.value)
				}
			}
			sortedBlocksRef.current = processedAccessors as EntityAccessor[]

			if (!monolithicReferencesMode && referencesField) {
				for (const index in children) {
					const node = children[index]
					const nodeReferences: EntityId[] = []
					const block = processedAccessors[index]!
					const references = block.getEntityList(referencesField)
					const collectReferences = (node: Descendant) => {
						if (!SlateElement.isElement(node)) {
							return
						}
						if (isElementWithReference(node)) {
							nodeReferences.push(node.referenceId)
						}
						for (const child of node.children) {
							collectReferences(child)
						}
					}
					collectReferences(node)
					for (const id of nodeReferences) {
						const entry = knownReferences.get(id)
						if (!entry) {
							if (trashFakeBlockId.current) {
								const fakeBlock = blockList.getChildEntityById(trashFakeBlockId.current)
								const fakeReferences = fakeBlock.getEntityList(referencesField)
								const ref = fakeReferences.getChildEntityById(id)
								references.connectEntity(ref)
								fakeReferences.disconnectEntity(ref)
							} else {
								throw new BindingError(`Reference ${id} not found.`)
							}
						} else {
							const [reference, prevBlock] = entry
							if (prevBlock !== block) {
								references.connectEntity(reference.getAccessor())
								prevBlock.getEntityList(referencesField).disconnectEntity(reference.getAccessor(), { noPersist: true })
							}
							knownReferences.delete(id)
						}
					}
				}
				for (const [, [reference, block]] of knownReferences) {
					if (!trashFakeBlockId.current) {
						blockList.createNewEntity(getAccessor => {
							getAccessor().getField(desugaredSortableByField).updateValue(Number.MAX_SAFE_INTEGER)
							trashFakeBlockId.current = getAccessor().id
						})
					}
					const trashBlock = blockList.getChildEntityById(trashFakeBlockId.current!)
					trashBlock.getEntityList(referencesField).connectEntity(reference)
					block.getEntityList(referencesField).disconnectEntity(reference, { noPersist: true })
				}
			}
			cleanupStack()
		})
	}, [blockElementCache, blockElementPathRefs, desugaredBlockContentField, desugaredBlockList, desugaredSortableByField, editor, getParentEntityRef, monolithicReferencesMode, referencesField, sortedBlocksRef, trashFakeBlockId])
}
