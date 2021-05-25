import { useField } from '@contember/binding'
import { EditorPlaceholder } from '@contember/ui'
import { memo } from 'react'
import { Node as SlateNode, Path as SlatePath } from 'slate'
import { ReactEditor, RenderElementProps, useEditor } from 'slate-react'
import { AccessorErrors } from '../../../errors'
import { BlockElement } from '../../baseEditor'
import type { ContemberFieldElement } from '../elements'
import type { FieldBackedElement } from '../FieldBackedElement'

export interface ContemberFieldElementRendererProps extends RenderElementProps {
	element: ContemberFieldElement
	leadingFields: FieldBackedElement[]
	trailingFields: FieldBackedElement[]
}

export const ContemberFieldElementRenderer = memo((props: ContemberFieldElementRendererProps) => {
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

	const accessor = useField(fieldBackedElement.field)

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
			{!!accessor.errors && (
				<div contentEditable={false} data-slate-editor={false}>
					<AccessorErrors accessor={accessor} size="small" />
				</div>
			)}
		</BlockElement>
	)
})
ContemberFieldElementRenderer.displayName = 'ContemberFieldElementRenderer'
