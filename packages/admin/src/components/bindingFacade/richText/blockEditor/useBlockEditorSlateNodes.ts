import { BindingError, EntityAccessor, FieldAccessor, RelativeSingleField } from '@contember/binding'
import * as React from 'react'
import { Element as SlateElement } from 'slate'
import { ElementNode } from '../baseEditor'
import { BlockSlateEditor } from './editor'
import {
	ContemberContentPlaceholderElement,
	contemberContentPlaceholderType,
	ContemberFieldElement,
	ContemberFieldElementPosition,
	contemberFieldElementType,
} from './elements'
import { NormalizedFieldBackedElement } from './FieldBackedElement'

export interface UseBlockEditorSlateNodesOptions {
	editor: BlockSlateEditor
	blockElementCache: WeakMap<EntityAccessor, ElementNode>
	contemberFieldElementCache: WeakMap<FieldAccessor, ContemberFieldElement>
	blockContentField: RelativeSingleField
	topLevelBlocks: EntityAccessor[]
	leadingFieldBackedElements: NormalizedFieldBackedElement[]
	//trailingFieldBackedElements: NormalizedFieldBackedElement[]
	placeholder: React.ReactNode
}

export const useBlockEditorSlateNodes = ({
	editor,
	blockElementCache,
	contemberFieldElementCache,
	blockContentField,
	topLevelBlocks,
	leadingFieldBackedElements,
	//trailingFieldBackedElements,
	placeholder,
}: UseBlockEditorSlateNodesOptions): SlateElement[] => {
	const adjacentAccessorsToElements = (
		elements: NormalizedFieldBackedElement[],
		position: ContemberFieldElementPosition,
	): SlateElement[] =>
		elements.map((normalizedElement, index) => {
			const existingElement = contemberFieldElementCache.get(normalizedElement.accessor)
			if (existingElement) {
				return existingElement
			}
			let element: ContemberFieldElement
			const fieldValue = normalizedElement.accessor.currentValue
			if (typeof fieldValue !== 'string' && fieldValue !== null) {
				throw new BindingError(
					`BlockEditor: The ${position} field backed element at index '${index}' does not contain a string value.`,
				)
			}
			if (fieldValue === null || fieldValue === '' || normalizedElement.format === 'plainText') {
				element = {
					type: contemberFieldElementType,
					children: [{ text: fieldValue || '' }],
					position,
					index,
				}
			} else {
				const deserialized = editor.deserializeNodes(
					fieldValue,
					`BlockEditor: The ${position} field backed element at index '${index}' contains invalid JSON.`,
				)
				element = {
					type: contemberFieldElementType,
					children: deserialized,
					position,
					index,
				}
			}
			contemberFieldElementCache.set(normalizedElement.accessor, element)
			return element
		})

	const topLevelBlockElements = topLevelBlocks.length
		? topLevelBlocks.map(entity => {
				const existingBlockElement = blockElementCache.get(entity)
				if (existingBlockElement) {
					return existingBlockElement
				}
				const contentField = entity.getRelativeSingleField(blockContentField)

				let blockElement: ElementNode

				if (contentField.currentValue === null || contentField.currentValue === '') {
					blockElement = editor.createDefaultElement([{ text: '' }])
				} else if (typeof contentField.currentValue !== 'string') {
					throw new BindingError(`BlockEditor: The 'textBlockField' does not contain a string value.`)
				} else {
					blockElement = editor.deserializeNodes(
						contentField.currentValue,
						`BlockEditor: The 'contentField' of a block contains invalid data.`,
					)[0] as ElementNode
				}
				blockElementCache.set(entity, blockElement)
				return blockElement
		  })
		: [
				{
					type: contemberContentPlaceholderType,
					children: [{ text: '' }],
					placeholder,
				} as ContemberContentPlaceholderElement,
		  ]
	return adjacentAccessorsToElements(leadingFieldBackedElements, 'leading').concat(
		topLevelBlockElements,
		//adjacentAccessorsToElements(trailingFieldBackedElements, 'trailing'),
	)
}
