import { Entity, useEnvironment, VariableInputTransformer } from '@contember/interface'
import { Element as SlateElement, type Range as SlateRange } from 'slate'
import { ReactNode, useEffect, useState } from 'react'
import { EntityAccessor, EntityId, OptionallyVariableFieldValue } from '@contember/binding'
import { useSlate } from 'slate-react'
import { EditorWithBlocks } from '@contember/react-legacy-editor'

export interface InitializeReferenceContentProps {
	referenceId: EntityId
	editor: EditorWithBlocks
	selection: SlateRange | null
	onSuccess: (options?: { createElement?: Partial<SlateElement> }) => void
	onCancel: () => void
}
export interface EditorInlineReferenceTriggerProps {
	referenceType: OptionallyVariableFieldValue
	initializeReference?: EntityAccessor.BatchUpdatesHandler,
	children: ReactNode
}


export const EditorInlineReferencePortal = (props: EditorInlineReferenceTriggerProps) => {
	const editor = useSlate() as EditorWithBlocks
	const environment = useEnvironment()
	const [entity, setEntity] = useState<EntityAccessor>()
	useEffect(() => {
		if (entity) {
			return
		}
		const discriminateBy = VariableInputTransformer.transformValue(props.referenceType, environment)
		const selection = editor.selection
		const targetPath = selection?.focus.path // TODO this is awful.
		// Transforms.deselect(editor)
		if (targetPath === undefined) {
			return
		}
		const reference = editor.createElementReference(
			targetPath,
			discriminateBy,
			props.initializeReference,
		)
		setEntity(reference)
	}, [editor, entity, environment, props.initializeReference, props.referenceType])

	if (!entity) {
		return null
	}
	return (
		<Entity accessor={entity}>
			{props.children}
		</Entity>
	)
}
