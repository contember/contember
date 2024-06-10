import { Descendant, Editor, Element, Transforms } from 'slate'
import { EntityAccessor, FieldValue } from '@contember/react-binding'
import { CreateElementReferences } from './useCreateElementReference'
import { useReferentiallyStableCallback } from '@contember/react-utils'
import { prepareElementForInsertion } from './utils'
import { ElementWithReference } from './elements'
import { useSlateStatic } from 'slate-react'
import { EditorReferenceBlocks } from '../../internal/helpers/useCreateEditorReferenceBlocks'
import { BindingError } from '@contember/binding'

export type InsertElementWithReference = (element: Partial<Element> & { type: string }, referenceDiscriminant: string, initialize?: EntityAccessor.BatchUpdatesHandler) => void

export const useInsertElementWithReference = ({ createElementReference, blocks, editor }: {
	createElementReference: CreateElementReferences
	blocks: EditorReferenceBlocks
	editor: Editor
}): InsertElementWithReference => {
	return useReferentiallyStableCallback((
			element: Partial<Element> & { type: string },
			referenceDiscriminant: string,
			initialize?: EntityAccessor.BatchUpdatesHandler,
		) => {

		const targetBlock = blocks[element.type]

		if (targetBlock === undefined) {
			throw new BindingError(
				`BlockEditor: Trying to insert a block discriminated by '${element.type}' but no such block has been found!`,
			)
		}

		const children: Descendant[] = targetBlock.isVoid ? [{ text: '' }] : [editor.createDefaultElement([{ text: '' }])]
		const elementWithChildren: Element = { children, ...element }

		Editor.withoutNormalizing(editor, () => {
			const path = prepareElementForInsertion(editor, true)
			const referenceId = createElementReference(referenceDiscriminant, initialize).id
			const newNode: ElementWithReference = { ...elementWithChildren, referenceId }
			Transforms.insertNodes(editor, newNode, { at: path })
		})
	})
}
