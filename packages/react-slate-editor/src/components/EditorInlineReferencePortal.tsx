import { Entity, useEnvironment } from '@contember/react-binding'
import { Editor, Element as SlateElement, type Range as SlateRange } from 'slate'
import { ReactNode, useEffect, useState } from 'react'
import { EntityAccessor, EntityId } from '@contember/react-binding'
import { useSlate } from 'slate-react'
import { useEditorReferenceMethods } from '../contexts'

export interface InitializeReferenceContentProps {
	referenceId: EntityId
	editor: Editor
	selection: SlateRange | null
	onSuccess: (options?: { createElement?: Partial<SlateElement> }) => void
	onCancel: () => void
}
export interface EditorInlineReferenceTriggerProps {
	referenceType: string
	initializeReference?: EntityAccessor.BatchUpdatesHandler
	children: ReactNode
}


export const EditorInlineReferencePortal = (props: EditorInlineReferenceTriggerProps) => {
	const editor = useSlate()
	const environment = useEnvironment()
	const [entity, setEntity] = useState<EntityAccessor>()
	const { createElementReference } = useEditorReferenceMethods()
	useEffect(() => {
		if (entity) {
			return
		}
		const selection = editor.selection
		const targetPath = selection?.focus.path
		// Transforms.deselect(editor)
		if (targetPath === undefined) {
			return
		}
		const reference = createElementReference(
			props.referenceType,
			props.initializeReference,
		)
		setEntity(reference)
	}, [createElementReference, editor, entity, environment, props.initializeReference, props.referenceType])

	if (!entity) {
		return null
	}
	return (
		<Entity accessor={entity}>
			{props.children}
		</Entity>
	)
}
