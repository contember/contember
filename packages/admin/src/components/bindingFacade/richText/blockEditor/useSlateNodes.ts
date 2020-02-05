import { BindingError, EntityAccessor, FieldValue, RelativeSingleField } from '@contember/binding'
import { Element } from 'slate'
import { NormalizedBlock } from '../../blocks'
import { ParagraphElement } from '../plugins/paragraphs'
import { ContemberBlockElement, contemberBlockElementType } from './ContemberBlockElement'

export interface UseSlateNodesOptions {
	blocks: NormalizedBlock[]
	discriminationField: RelativeSingleField
	elementCache: WeakMap<EntityAccessor, Element>
	textBlockField: RelativeSingleField
	textBlockDiscriminant: FieldValue
	entities: EntityAccessor[]
}

// { "type": "paragraph", "children": [{ "text": "This is a sample paragraph." }] }
const emptyChildren = [{ text: '' }]
export const useSlateNodes = ({
	blocks,
	discriminationField,
	elementCache,
	textBlockField,
	textBlockDiscriminant,
	entities,
}: UseSlateNodesOptions): Element[] =>
	entities.map(entity => {
		if (elementCache.has(entity)) {
			return elementCache.get(entity)!
		}
		let element: Element
		const blockType = entity.getRelativeSingleField(discriminationField)

		if (blockType.hasValue(textBlockDiscriminant)) {
			// This is a text block
			const textAccessor = entity.getRelativeSingleField(textBlockField)

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
		} else {
			const selectedBlock = blocks.find(block => blockType.hasValue(block.discriminateBy))

			if (selectedBlock === undefined) {
				throw new BindingError(`BlockEditor: Encountered an entity without a corresponding block definition.`)
			}
			const contemberBlock: ContemberBlockElement = {
				type: contemberBlockElementType,
				children: emptyChildren,
				entity,
				blockType: selectedBlock.discriminateBy,
			}
			element = contemberBlock
		}

		elementCache.set(entity, element)
		return element
	})
