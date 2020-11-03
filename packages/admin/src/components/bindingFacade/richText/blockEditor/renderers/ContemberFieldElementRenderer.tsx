import { useRelativeSingleField } from '@contember/binding'
import { EditorPlaceholder, ErrorList } from '@contember/ui'
import * as React from 'react'
import { Node as SlateNode, Path as SlatePath } from 'slate'
import { ReactEditor, RenderElementProps, useEditor } from 'slate-react'
import { BlockElement } from '../../baseEditor'
import { ContemberFieldElement } from '../elements'
import { FieldBackedElement } from '../FieldBackedElement'

export interface ContemberFieldElementRendererProps extends RenderElementProps {
	element: ContemberFieldElement
	leadingFields: FieldBackedElement[]
	trailingFields: FieldBackedElement[]
}

export const ContemberFieldElementRenderer = React.memo((props: ContemberFieldElementRendererProps) => {
	const fieldString = SlateNode.string(props.element)
	const shouldDisplayPlaceholder = fieldString === ''
	const editor = useEditor()
	const path = ReactEditor.findPath(editor, props.element)
	const parentPath = SlatePath.parent(path)
	const parent = SlateNode.get(editor, parentPath)
	const lastIndex = path[path.length - 1]

	const fieldBackedElement =
		lastIndex < props.leadingFields.length
			? props.leadingFields[lastIndex]
			: props.trailingFields[props.trailingFields.length - (parent.children.length - lastIndex)]

	const accessor = useRelativeSingleField(fieldBackedElement.field)

	return (
		<BlockElement attributes={props.attributes} element={props.element}>
			{fieldBackedElement.render({
				isEmpty: shouldDisplayPlaceholder,
				children: (
					<>
						{shouldDisplayPlaceholder && <EditorPlaceholder>{fieldBackedElement.placeholder}</EditorPlaceholder>}
						{props.children}
					</>
				),
			})}
			{!!accessor.errors.length && (
				<div contentEditable={false} data-slate-editor={false}>
					<ErrorList errors={accessor.errors} size="small" />
				</div>
			)}
		</BlockElement>
	)
})
ContemberFieldElementRenderer.displayName = 'ContemberFieldElementRenderer'
