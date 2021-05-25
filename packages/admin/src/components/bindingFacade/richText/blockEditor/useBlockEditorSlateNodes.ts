import { BindingError, EntityAccessor, FieldAccessor, RelativeSingleField } from '@contember/binding'
import type { ReactNode } from 'react'
import { Editor, Element as SlateElement, PathRef } from 'slate'
import type { ElementNode } from '../baseEditor'
import type { BlockSlateEditor } from './editor'
import {
	ContemberContentPlaceholderElement,
	contemberContentPlaceholderType,
	ContemberFieldElement,
	contemberFieldElementType,
} from './elements'
import type { FieldBackedElement } from './FieldBackedElement'

export interface UseBlockEditorSlateNodesOptions {
	editor: BlockSlateEditor
	blockElementCache: WeakMap<EntityAccessor, ElementNode>
	blockElementPathRefs: Map<string, PathRef>
	contemberFieldElementCache: WeakMap<FieldAccessor<string>, ContemberFieldElement>
	blockContentField: RelativeSingleField
	topLevelBlocks: EntityAccessor[]
	leadingFieldBackedElements: FieldBackedElement[]
	trailingFieldBackedElements: FieldBackedElement[]
	leadingFieldBackedAccessors: FieldAccessor<string>[]
	trailingFieldBackedAccessors: FieldAccessor<string>[]
	placeholder: ReactNode
}

export const useBlockEditorSlateNodes = ({
	editor,
	blockElementCache,
	blockElementPathRefs,
	contemberFieldElementCache,
	blockContentField,
	topLevelBlocks,
	leadingFieldBackedElements,
	trailingFieldBackedElements,
	leadingFieldBackedAccessors,
	trailingFieldBackedAccessors,
	placeholder,
}: UseBlockEditorSlateNodesOptions): SlateElement[] => {
	if (editor.operations.length) {
		// This is *ABSOLUTELY CRUCIAL*!
		//	Slate invokes the onChange callback asynchronously, and so it could happen that this hook is invoked whilst
		//	there are pending changes that the onChange routines haven't had a chance to let binding know about yet.
		//	In those situations, if this hook were to generate elements based on accessors, it would effectively
		//	prevent the pending changes from ever happening because Slate updates editor.children based on the value
		//	this hook generates and onChange in turn uses editor.children to update accessors.
		//	Consequently, whenever there are pending changes, we just return whatever children the editor already has
		//	because we know that an onChange is already scheduled.
		return editor.children as SlateElement[]
	}

	const adjacentAccessorsToElements = (
		elements: FieldBackedElement[],
		accessors: FieldAccessor<string>[],
	): SlateElement[] =>
		elements.map((normalizedElement, index) => {
			const accessor = accessors[index]
			const existingElement = contemberFieldElementCache.get(accessor)
			if (existingElement) {
				return existingElement
			}

			let element: ContemberFieldElement
			const fieldValue = accessor.value

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
		? topLevelBlocks.map((entity, index) => {
				const existingBlockElement = blockElementCache.get(entity)

				const blockPathRef = blockElementPathRefs.get(entity.id)
				const desiredIndex = index + leadingFieldBackedElements.length

				if (blockPathRef === undefined) {
					blockElementPathRefs.set(entity.id, Editor.pathRef(editor, [desiredIndex], { affinity: 'backward' }))
				} else {
					const current = blockPathRef.current
					if (current === null || current.length !== 1 || current[0] !== desiredIndex) {
						blockPathRef.unref()
						blockElementPathRefs.set(entity.id, Editor.pathRef(editor, [desiredIndex], { affinity: 'backward' }))
					}
				}

				if (existingBlockElement) {
					return existingBlockElement
				}
				const contentField = entity.getRelativeSingleField(blockContentField)

				let blockElement: ElementNode

				if (contentField.value === null || contentField.value === '') {
					blockElement = editor.createDefaultElement([{ text: '' }])
				} else if (typeof contentField.value !== 'string') {
					throw new BindingError(`BlockEditor: The 'textBlockField' does not contain a string value.`)
				} else {
					blockElement = editor.deserializeNodes(
						contentField.value,
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
	return ([] as SlateElement[]).concat(
		adjacentAccessorsToElements(leadingFieldBackedElements, leadingFieldBackedAccessors),
		topLevelBlockElements,
		adjacentAccessorsToElements(trailingFieldBackedElements, trailingFieldBackedAccessors),
	)
}
