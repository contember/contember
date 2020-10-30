import {
	BindingOperations,
	EntityAccessor,
	FieldAccessor,
	RelativeEntityList,
	RelativeSingleField,
} from '@contember/binding'
import * as React from 'react'
import { Editor, Element as SlateElement, Node as SlateNode, PathRef } from 'slate'
import { assertNever } from '../../../../../utils'
import { EditorNode, ElementNode, TextNode } from '../../baseEditor'
import { ContemberContentPlaceholderElement, ContemberFieldElement } from '../elements'
import { FieldBackedElement } from '../FieldBackedElement'
import { BlockSlateEditor } from './BlockSlateEditor'

export interface OverrideOnChangeOptions {
	batchUpdatesRef: React.MutableRefObject<EntityAccessor['batchUpdates']>
	bindingOperations: BindingOperations
	blockContentField: RelativeSingleField
	blockElementCache: WeakMap<EntityAccessor, ElementNode>
	blockElementPathRefs: Map<string, PathRef>
	contemberFieldElementCache: WeakMap<FieldAccessor<string>, ContemberFieldElement>
	desugaredBlockList: RelativeEntityList
	isMutatingRef: React.MutableRefObject<boolean>
	leadingFields: FieldBackedElement[]
	trailingFields: FieldBackedElement[]
	placeholder: ContemberContentPlaceholderElement['placeholder']
	sortableByField: RelativeSingleField
	sortedBlocksRef: React.MutableRefObject<EntityAccessor[]>
}

export const overrideSlateOnChange = <E extends BlockSlateEditor>(
	editor: E,
	{
		batchUpdatesRef,
		bindingOperations,
		blockContentField,
		blockElementCache,
		blockElementPathRefs,
		contemberFieldElementCache,
		desugaredBlockList,
		isMutatingRef,
		leadingFields,
		trailingFields,
		placeholder,
		sortableByField,
		sortedBlocksRef,
	}: OverrideOnChangeOptions,
) => {
	const { slateOnChange } = editor
	const { getEntityByKey } = bindingOperations

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

		const firstContentIndex = leadingFields.length
		const leadingCount = leadingFields.length
		const trailingCount = trailingFields.length

		const topLevelBlocks = sortedBlocksRef.current

		const isLeadingElement = (elementIndex: number) => elementIndex < firstContentIndex
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
								saveBlockElement(
									topLevelBlocks[topLevelIndex - leadingCount].key,
									children[topLevelIndex] as EditorNode,
								)
							}
						}
					}
				}
				return slateOnChange()
			})
		}

		console.log('onChange: node op', operations)

		return batchUpdatesRef.current((getAccessor, { getEntityByKey }) => {
			const processedAccessors: Array<true | undefined> = Array.from({
				length: editor.children.length - leadingCount - trailingCount,
			})
			const blockList = getAccessor().getRelativeEntityList(desugaredBlockList)

			for (const [blockKey, pathRef] of blockElementPathRefs) {
				const current = pathRef.current
				const originalBlock = getEntityByKey(blockKey)

				if (current === null || current.length > 1) {
					originalBlock.deleteEntity()
					pathRef.unref()
					blockElementPathRefs.delete(blockKey)
				} else {
					const newBlockIndex = current[0]
					const newBlockOrder = newBlockIndex - leadingCount

					if (processedAccessors[newBlockOrder]) {
						// This path has already been processed. This happens when nodes get merged.
						originalBlock.deleteEntity()
						pathRef.unref()
						blockElementPathRefs.delete(blockKey)
					} else {
						const originalElement = blockElementCache.get(originalBlock)
						const currentElement = editor.children[newBlockIndex] as EditorNode

						if (
							originalElement !== currentElement ||
							originalBlock.getRelativeSingleField(sortableByField).currentValue !== newBlockOrder
						) {
							getEntityByKey(blockKey).getRelativeSingleField(sortableByField).updateValue(newBlockOrder)
							saveBlockElement(blockKey, currentElement)
						}
						processedAccessors[newBlockOrder] = true
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
				} else {
					const blockOrder = topLevelIndex - leadingCount
					const isProcessed = processedAccessors[blockOrder]
					if (!isProcessed) {
						blockList.createNewEntity(getAccessor => {
							const newKey = getAccessor().key
							getAccessor().getRelativeSingleField(sortableByField).updateValue(blockOrder)
							saveBlockElement(newKey, child as EditorNode)
							blockElementPathRefs.set(newKey, Editor.pathRef(editor, [blockOrder], { affinity: 'backward' }))
						})
					}
				}
			}

			for (const operation of operations) {
				if (operation.type === 'remove_node') {
					purgeElementReferences(operation.node)
				} else if (operation.type === 'merge_node') {
					// TODO: purge references. But HOW?!
				} else if (operation.type === 'split_node') {
					// TODO: clone references. But HOW?!
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
		const targetValue =
			fieldBackedElement.format === 'richText'
				? editor.serializeNodes(editorElement.children)
				: SlateNode.string(editorElement)
		getParentEntity().getField(fieldBackedElement.field).updateValue(targetValue)
		contemberFieldElementCache.set(getParentEntity().getField(fieldBackedElement.field), editorElement)
	}

	const saveBlockElement = (key: string, element: EditorNode) => {
		getEntityByKey(key)
			.getRelativeSingleField(blockContentField)
			.updateValue(editor.serializeNodes([element]))
		blockElementCache.set(getEntityByKey(key), element)
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
}
