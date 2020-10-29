import { BindingError, EntityAccessor, FieldAccessor, RelativeSingleField } from '@contember/binding'
import * as React from 'react'
import { Element as SlateElement } from 'slate'
import { ElementNode } from '../baseEditor'
import { BlockSlateEditor } from './editor'
import {
	ContemberContentPlaceholderElement,
	contemberContentPlaceholderType,
	ContemberFieldElement,
	contemberFieldElementType,
} from './elements'
import { FieldBackedElement } from './FieldBackedElement'

export interface UseBlockEditorSlateNodesOptions {
	editor: BlockSlateEditor
	blockElementCache: WeakMap<EntityAccessor, ElementNode>
	contemberFieldElementCache: WeakMap<FieldAccessor<string>, ContemberFieldElement>
	blockContentField: RelativeSingleField
	topLevelBlocks: EntityAccessor[]
	leadingFieldBackedElements: FieldBackedElement[]
	leadingFieldBackedAccessors: FieldAccessor<string>[]
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
	leadingFieldBackedAccessors,
	//trailingFieldBackedElements,
	placeholder,
}: UseBlockEditorSlateNodesOptions): SlateElement[] => {
	const adjacentAccessorsToElements = (elements: FieldBackedElement[]): SlateElement[] =>
		elements.map((normalizedElement, index) => {
			const accessor = leadingFieldBackedAccessors[index]
			const existingElement = contemberFieldElementCache.get(accessor)
			if (existingElement) {
				return existingElement
			}

			let element: ContemberFieldElement
			const fieldValue = accessor.currentValue

			if (fieldValue === null || fieldValue === '' || normalizedElement.format === 'plainText') {
				element = {
					type: contemberFieldElementType,
					children: [{ text: fieldValue || '' }],
				}
			} else {
				const deserialized = editor.deserializeNodes(fieldValue)
				element = {
					type: contemberFieldElementType,
					children: deserialized,
				}
			}
			contemberFieldElementCache.set(accessor, element)
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
	return adjacentAccessorsToElements(leadingFieldBackedElements).concat(
		topLevelBlockElements,
		//adjacentAccessorsToElements(trailingFieldBackedElements, 'trailing'),
	)
}
