import type {
	EntityAccessor,
	EntityListAccessor,
	FieldAccessor,
	RelativeEntityList,
	RelativeSingleField,
} from '@contember/binding'
import type { MutableRefObject } from 'react'
import { Editor, Element, Element as SlateElement, Node as SlateNode, PathRef } from 'slate'
import { assertNever } from '../../../../../utils'
import type { ContemberFieldElement } from '../elements'
import type { FieldBackedElement } from '../FieldBackedElement'
import type { BlockSlateEditor } from './BlockSlateEditor'
import type { Unstable_BlockEditorDiagnostics } from './Unstable_BlockEditorDiagnostics'

export interface OverrideOnChangeOptions {
	blockContentField: RelativeSingleField
	blockElementCache: WeakMap<EntityAccessor, SlateElement>
	blockElementPathRefs: Map<string, PathRef>
	contemberFieldElementCache: WeakMap<FieldAccessor<string>, ContemberFieldElement>
	desugaredBlockList: RelativeEntityList
	getParentEntityRef: MutableRefObject<EntityAccessor.GetEntityAccessor>
	leadingFields: FieldBackedElement[]
	trailingFields: FieldBackedElement[]
	sortableByField: RelativeSingleField
	sortedBlocksRef: MutableRefObject<EntityAccessor[]>

	unstable_diagnosticLog: Unstable_BlockEditorDiagnostics | undefined
}

export const overrideSlateOnChange = <E extends BlockSlateEditor>(
	editor: E,
	{
		blockContentField,
		blockElementCache,
		blockElementPathRefs,
		contemberFieldElementCache,
		desugaredBlockList,
		getParentEntityRef,
		leadingFields,
		trailingFields,
		sortableByField,
		sortedBlocksRef,
		unstable_diagnosticLog,
	}: OverrideOnChangeOptions,
) => {
	const { slateOnChange } = editor

	editor.slateOnChange = () => {
		const { children, operations } = editor

		if (unstable_diagnosticLog) {
			editor.unstable_diagnosticOperationLog.push(operations)
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

			return getParentEntityRef.current().batchUpdates(getEntity => {
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
								saveBlockElement(
									getEntity().getRelativeEntityList(desugaredBlockList).getAccessor,
									topLevelBlocks[topLevelIndex - leadingCount].id,
									children[topLevelIndex] as Element,
								)
							}
						}
					}
				}
				return slateOnChange()
			})
		}

		return getParentEntityRef.current().batchUpdates(getAccessor => {
			const processedAccessors: Array<true | undefined> = Array.from({
				length: editor.children.length - leadingCount - trailingCount,
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

					if (isLeadingElement(newBlockIndex) || isTrailingElement(newBlockIndex)) {
						cleanUp()
					} else {
						const newBlockOrder = newBlockIndex - leadingCount

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
							saveBlockElement(getBlockList, newId, child as Element)
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

	const saveBlockElement = (getBlockList: () => EntityListAccessor, id: string, element: Element) => {
		getBlockList()
			.getChildEntityById(id)
			.getRelativeSingleField(blockContentField)
			.updateValue(editor.serializeNodes([element]))
		blockElementCache.set(getBlockList().getChildEntityById(id), element)
	}
}
