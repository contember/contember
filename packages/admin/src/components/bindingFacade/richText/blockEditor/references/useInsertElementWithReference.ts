import { useCallback } from 'react'
import { Editor, Element as SlateElement, Transforms } from 'slate'
import { EntityAccessor, FieldValue } from '@contember/binding'
import { prepareElementForInsertion } from '../utils'
import { ElementWithReference } from '../elements'
import { CreateElementReferences } from './useCreateElementReference'

export type InsertElementWithReference = (element: Omit<SlateElement, 'referenceId'>, referenceDiscriminant: FieldValue, initialize?: EntityAccessor.BatchUpdatesHandler) => void

export const useInsertElementWithReference = ({ editor,  createElementReference }: {
	editor: Editor
	createElementReference: CreateElementReferences
}): InsertElementWithReference => {
	return useCallback(<Element extends SlateElement>(
			element: Omit<Element, 'referenceId'>,
			referenceDiscriminant: FieldValue,
			initialize?: EntityAccessor.BatchUpdatesHandler,
		) => {
		Editor.withoutNormalizing(editor, () => {
			const preppedPath = prepareElementForInsertion(editor, element as Element)
			Transforms.insertNodes(editor, editor.createDefaultElement([{ text: '' }]), { at: preppedPath })
			const referenceId = createElementReference(editor, preppedPath, referenceDiscriminant, initialize).id
			const newNode: ElementWithReference = { ...(element as Element), referenceId }
			Transforms.setNodes(editor, newNode, { at: preppedPath })
		})
	}, [createElementReference, editor])
}
