import { MutableRefObject, useCallback, useRef, useState } from 'react'
import { assertNever } from '../../../../../utils'
import { Descendant, Editor, Element as SlateElement, Element, Node } from 'slate'
import {
	BindingError,
	EntityAccessor,
	EntityListAccessor,
	SugaredFieldProps, SugaredRelativeEntityList, useDesugaredRelativeEntityList,
	useDesugaredRelativeSingleField, useEntityBeforePersist,
} from '@contember/binding'
import { useGetParentEntityRef } from '../useGetParentEntityRef'
import { BlockElementCache } from './useBlockElementCache'
import { BlockElementPathRefs } from './useBlockElementPathRefs'
import { isElementWithReference } from '../elements'

export const useBlockEditorOnChange = ({ editor, sortedBlocksRef, sortableBy, contentField, blockList, blockElementCache, blockElementPathRefs, referencesField, monolithicReferencesMode }: {
	editor: Editor,
	sortedBlocksRef: MutableRefObject<EntityAccessor[]>,
	contentField: SugaredFieldProps['field'],
	sortableBy: SugaredFieldProps['field'],
	blockList: SugaredRelativeEntityList,
	blockElementCache: BlockElementCache,
	blockElementPathRefs: BlockElementPathRefs
	referencesField?: SugaredRelativeEntityList | string
	monolithicReferencesMode?: boolean
}) => {

	const getParentEntityRef = useGetParentEntityRef()
	const desugaredBlockList = useDesugaredRelativeEntityList(blockList)
	const desugaredBlockContentField = useDesugaredRelativeSingleField(contentField)
	const desugaredSortableByField = useDesugaredRelativeSingleField(sortableBy)
	const trashFakeBlockId = useRef<string>()
	useEntityBeforePersist(() => {
		if (trashFakeBlockId.current) {
			const block = getParentEntityRef.current().getRelativeEntityList(desugaredBlockList).getChildEntityById(trashFakeBlockId.current)
			block.deleteEntity()
			trashFakeBlockId.current = undefined
		}
	})

	return useCallback(() => {
		const { children, operations } = editor
		console.log({ children, operations })
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
			const processedAccessors: Array<EntityAccessor | undefined> = Array.from({
				length: editor.children.length,
			})
			const blockList = getAccessor().getRelativeEntityList(desugaredBlockList)
			const getBlockList = blockList.getAccessor

			let cleanupStack = () => {
			}
			const knownReferences = new Map<string, [reference: EntityAccessor, block: EntityAccessor]>()

			for (const [blockId, pathRef] of blockElementPathRefs) {
				const current = pathRef.current
				const block = getBlockList().getChildEntityById(blockId)
				if (!monolithicReferencesMode && referencesField) {
					for (const reference of block.getEntityList(referencesField)) {
						knownReferences.set(reference.id, [reference, block])
					}
				}
				const cleanUp = () => {
					const prev = cleanupStack
					cleanupStack = () => {
						prev()
						block.deleteEntity()
						pathRef.unref()
						blockElementPathRefs.delete(blockId)
					}
				}

				if (current === null || current.length > 1) {
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
							block.getRelativeSingleField(desugaredSortableByField).value !== newBlockOrder
						) {
							block
								.getRelativeSingleField(desugaredSortableByField)
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
						getAccessor().getRelativeSingleField(desugaredSortableByField).updateValue(blockOrder)
						saveBlockElement(getBlockList, newId, child as Element)
						blockElementPathRefs.set(newId, Editor.pathRef(editor, [topLevelIndex], { affinity: 'backward' }))
					})
					processedAccessors[blockOrder] = blockList.getChildEntityById(id.value)
				}
			}
			if (!monolithicReferencesMode && referencesField) {
				for (const index in children) {
					const node = children[index]
					const nodeReferences: string[] = []
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
							getAccessor().getRelativeSingleField(desugaredSortableByField).updateValue(Number.MAX_SAFE_INTEGER)
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
	}, [blockElementCache, blockElementPathRefs, desugaredBlockContentField, desugaredBlockList, desugaredSortableByField, editor, getParentEntityRef, monolithicReferencesMode, referencesField, sortedBlocksRef])
}
