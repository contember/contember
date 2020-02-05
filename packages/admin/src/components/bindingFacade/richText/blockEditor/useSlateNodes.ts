import { BindingError, EntityAccessor, FieldValue, RelativeSingleField } from '@contember/binding'
import { Element } from 'slate'
import { NormalizedBlock } from '../../blocks'
import { ParagraphElement } from '../plugins/paragraphs'
import { ContemberBlockElement, contemberBlockElementType } from './ContemberBlockElement'

export interface UseSlateNodesOptions {
	blocks: NormalizedBlock[]
	discriminationField: RelativeSingleField
	textElementCache: WeakMap<EntityAccessor, Element>
	contemberBlockElementCache: Map<string, Element>
	textBlockField: RelativeSingleField
	textBlockDiscriminant: FieldValue
	entities: EntityAccessor[]
}

const emptyChildren = [{ text: '' }]
export const useSlateNodes = ({
	blocks,
	discriminationField,
	textElementCache,
	contemberBlockElementCache,
	textBlockField,
	textBlockDiscriminant,
	entities,
}: UseSlateNodesOptions): Element[] =>
	entities.map(entity => {
		if (textElementCache.has(entity)) {
			return textElementCache.get(entity)!
		}
		const entityKey = entity.getKey()

		if (contemberBlockElementCache.has(entityKey)) {
			return contemberBlockElementCache.get(entityKey)!
		}

		const blockType = entity.getRelativeSingleField(discriminationField)

		if (blockType.hasValue(textBlockDiscriminant)) {
			// This is a text block
			const textAccessor = entity.getRelativeSingleField(textBlockField)
			let element: Element

			if (textAccessor.currentValue === null || textAccessor.currentValue === '') {
				const paragraphElement: ParagraphElement = {
					type: 'paragraph',
					children: emptyChildren,
				}
				element = paragraphElement
			} else if (typeof textAccessor.currentValue !== 'string') {
				throw new BindingError(`BlockEditor: The 'textBlockField' does not contain a string value.`)
			} else {
				try {
					element = JSON.parse(textAccessor.currentValue)
				} catch (_) {
					throw new BindingError(`BlockEditor: The 'textBlockField' contains invalid JSON.`)
				}
			}
			textElementCache.set(entity, element)
			return element
		} else {
			const selectedBlock = blocks.find(block => blockType.hasValue(block.discriminateBy))

			if (selectedBlock === undefined) {
				throw new BindingError(`BlockEditor: Encountered an entity without a corresponding block definition.`)
			}
			const contemberBlock: ContemberBlockElement = {
				type: contemberBlockElementType,
				children: emptyChildren,
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
		}
	})
