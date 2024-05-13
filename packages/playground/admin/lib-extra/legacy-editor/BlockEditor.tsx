import { ReactNode } from 'react'
import { EditorCanvas } from './EditorCanvas'
import { EditableCanvas } from './EditableCanvas'
import { BlockEditor, BlockEditorProps, useEditor } from '@contember/react-legacy-editor'
import { Component } from '@contember/interface'
import { SortableBlock } from './SortableBlock'
import { ReferenceElementRenderer } from './elements/ReferenceElementRenderer'
import { RepeaterSortable, useRepeaterSortedEntities } from '@contember/react-repeater-dnd-kit'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'

export type BlockEditorFieldProps =
	& Omit<BlockEditorProps, 'renderSortableBlock' | 'renderReference'>
	& {
		placeholder?: string
	}

export const BlockEditorField = Component<BlockEditorFieldProps>(({ placeholder, children, ...props }) => {
	return (
		<BlockEditor {...props} renderSortableBlock={SortableBlock} renderReference={ReferenceElementRenderer}>
			<RepeaterSortable>
				<BlockEditorInner placeholder={placeholder}>
					{children}
				</BlockEditorInner>
			</RepeaterSortable>
		</BlockEditor>
	)
})

export const BlockEditorInner = ({ children, placeholder }: {
	placeholder?: string
	children: ReactNode
}) => {
	const editor = useEditor()
	const entities = useRepeaterSortedEntities()

	return (
		<SortableContext items={entities} strategy={verticalListSortingStrategy}>
			<EditorCanvas
				underlyingComponent={EditableCanvas}
				componentProps={{
					renderElement: editor.renderElement,
					renderLeaf: editor.renderLeaf,
					onKeyDown: editor.onKeyDown,
					onFocusCapture: editor.onFocus,
					onBlurCapture: editor.onBlur,
					onDOMBeforeInput: editor.onDOMBeforeInput,
					onDrop: (e => {
						e.preventDefault()
					}),
					placeholder: placeholder,
				}}

			>
				{children}
			</EditorCanvas>
		</SortableContext>
	)
}
