import { BindingError, EntityAccessor, FieldAccessor, FieldValue, RelativeSingleField } from '@contember/binding'
import * as React from 'react'
import { Element as SlateElement } from 'slate'
import { getDiscriminatedBlock, NormalizedBlocks } from '../../blocks'
import { getDiscriminatedDatum } from '../../discrimination'
import { BlockSlateEditor } from './editor'
import {
	ContemberBlockElement,
	contemberBlockElementType,
	ContemberContentPlaceholderElement,
	contemberContentPlaceholderType,
	ContemberEmbedElement,
	contemberEmbedElementType,
	ContemberFieldElement,
	ContemberFieldElementPosition,
	contemberFieldElementType,
} from './elements'
import { NormalizedEmbedHandlers } from './embed'
import { NormalizedFieldBackedElement } from './FieldBackedElement'

export interface UseBlockEditorSlateNodesOptions {
	editor: BlockSlateEditor
	blocks: NormalizedBlocks
	discriminationField: RelativeSingleField
	contemberFieldElementCache: WeakMap<FieldAccessor, SlateElement>
	textElementCache: WeakMap<EntityAccessor, SlateElement>
	contemberBlockElementCache: Map<string, SlateElement>
	textBlockField: RelativeSingleField
	textBlockDiscriminant: FieldValue
	embedContentDiscriminationField: RelativeSingleField | undefined
	embedBlockDiscriminant: FieldValue | undefined
	embedHandlers: NormalizedEmbedHandlers
	entities: EntityAccessor[]
	leadingFieldBackedElements: NormalizedFieldBackedElement[]
	//trailingFieldBackedElements: NormalizedFieldBackedElement[]
	placeholder: React.ReactNode
}

export const useBlockEditorSlateNodes = ({
	editor,
	blocks,
	discriminationField,
	textElementCache,
	contemberFieldElementCache,
	contemberBlockElementCache,
	textBlockField,
	textBlockDiscriminant,
	embedContentDiscriminationField,
	embedBlockDiscriminant,
	embedHandlers,
	entities,
	leadingFieldBackedElements,
	//trailingFieldBackedElements,
	placeholder,
}: UseBlockEditorSlateNodesOptions): SlateElement[] => {
	const adjacentAccessorsToElements = (
		elements: NormalizedFieldBackedElement[],
		position: ContemberFieldElementPosition,
	): SlateElement[] =>
		elements.map((normalizedElement, index) => {
			if (contemberFieldElementCache.has(normalizedElement.accessor)) {
				return contemberFieldElementCache.get(normalizedElement.accessor)!
			}
			let element: SlateElement
			const fieldValue = normalizedElement.accessor.currentValue
			if (typeof fieldValue !== 'string' && fieldValue !== null) {
				throw new BindingError(
					`BlockEditor: The ${position} field backed element at index '${index}' does not contain a string value.`,
				)
			}
			if (fieldValue === null || fieldValue === '' || normalizedElement.format === 'plainText') {
				const fieldElement: ContemberFieldElement = {
					type: contemberFieldElementType,
					children: [{ text: fieldValue || '' }],
					position,
					index,
				}
				element = fieldElement
			} else {
				element = editor.deserializeElements(
					fieldValue,
					`BlockEditor: The ${position} field backed element at index '${index}' contains invalid JSON.`,
				)[0]
			}
			contemberFieldElementCache.set(normalizedElement.accessor, element)
			return element
		})

	const contentElements = entities.length
		? entities.map(entity => {
				if (textElementCache.has(entity)) {
					return textElementCache.get(entity)!
				}
				const entityKey = entity.key

				if (contemberBlockElementCache.has(entityKey)) {
					return contemberBlockElementCache.get(entityKey)!
				}

				const blockType = entity.getRelativeSingleField(discriminationField)

				if (blockType.hasValue(textBlockDiscriminant)) {
					// This is a text block
					const textAccessor = entity.getRelativeSingleField(textBlockField)
					let element: SlateElement

					if (textAccessor.currentValue === null || textAccessor.currentValue === '') {
						element = editor.createDefaultElement([{ text: '' }])
					} else if (typeof textAccessor.currentValue !== 'string') {
						throw new BindingError(`BlockEditor: The 'textBlockField' does not contain a string value.`)
					} else {
						element = editor.deserializeElements(
							textAccessor.currentValue,
							`BlockEditor: The 'textBlockField' contains invalid JSON.`,
						)[0]
					}
					textElementCache.set(entity, element)
					return element
				}
				if (embedBlockDiscriminant !== undefined && blockType.hasValue(embedBlockDiscriminant)) {
					// This is an embed block.

					const embedContentType = entity.getRelativeSingleField(embedContentDiscriminationField!)
					const embedHandler = getDiscriminatedDatum(embedHandlers, embedContentType)

					if (embedHandler === undefined) {
						throw new BindingError() // TODO message
					}

					const embedBlock: ContemberEmbedElement = {
						type: contemberEmbedElementType,
						children: [{ text: '' }],
						embedArtifacts: undefined,
						source: undefined,
						embedHandler,
						entityKey,
					}
					// TODO same as below: this is a memory leak.
					contemberBlockElementCache.set(entityKey, embedBlock)
					return embedBlock
				}

				// If we make it to here, this is a regular contember block.

				const selectedBlock = getDiscriminatedBlock(blocks, blockType)

				if (selectedBlock === undefined) {
					throw new BindingError(`BlockEditor: Encountered an entity without a corresponding block definition.`)
				}
				const contemberBlock: ContemberBlockElement = {
					type: contemberBlockElementType,
					children: [{ text: '' }],
					entityKey,
					blockType: selectedBlock.discriminateBy,
				}
				/*
				TODO This is a memory leak as we don't ever remove the blocks from the map. They're tiny objects though and
					we're not expecting the user to create thousands and thousands of them so it's not that big of a deal but it's
					still far from ideal. How do we fix this though? 🤔
				*/
				contemberBlockElementCache.set(entityKey, contemberBlock)
				return contemberBlock
		  })
		: [
				{
					type: contemberContentPlaceholderType,
					children: [{ text: '' }],
					placeholder,
				} as ContemberContentPlaceholderElement,
		  ]
	return adjacentAccessorsToElements(leadingFieldBackedElements, 'leading').concat(
		contentElements,
		//adjacentAccessorsToElements(trailingFieldBackedElements, 'trailing'),
	)
}
