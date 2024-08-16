import { ReactNode, useCallback } from 'react'
import { EditorCanvas, EditorEditableCanvas } from '@app/lib/editor'
import { BlockEditor, BlockEditorProps } from '@contember/react-slate-editor-legacy'
import { Component } from '@contember/interface'
import { SortableBlock } from './SortableBlock'
import { ReferenceElementRenderer } from './ReferenceElementRenderer'
import { RepeaterSortable, useRepeaterSortedEntities } from '@contember/react-repeater-dnd-kit'
import { useSlateStatic } from 'slate-react'
import { DragEndEvent } from '@dnd-kit/core'
import { Transforms } from 'slate'

export type BlockEditorFieldProps =
	& Omit<BlockEditorProps, 'renderSortableBlock' | 'renderReference'>
	& {
		placeholder?: string
	}

export const BlockEditorField = Component<BlockEditorFieldProps>(({ placeholder, children, ...props }) => {
	return (
		<BlockEditor {...props} renderSortableBlock={SortableBlock} renderReference={ReferenceElementRenderer}>
			<BlockEditorSortable placeholder={placeholder}>
				{children}
			</BlockEditorSortable>
		</BlockEditor>
	)
})

const BlockEditorSortable = ({ children, placeholder }: { children: ReactNode; placeholder?: string }) => {
	const editor = useSlateStatic()
	const entities = useRepeaterSortedEntities()
	const onDragEnd = useCallback(({ active, over }: DragEndEvent) => {
		if (!over) {
			return
		}
		const activeNodeIndex = entities.findIndex(it => it.id === active.id)
		const overNodeIndex = entities.findIndex(it => it.id === over.id)

		if (activeNodeIndex === undefined || overNodeIndex === undefined || activeNodeIndex === overNodeIndex) {
			return
		}
		Transforms.moveNodes(editor, {
			at: [activeNodeIndex],
			to: [overNodeIndex],
		})
	}, [editor, entities])

	return (
		<RepeaterSortable onDragEnd={onDragEnd} autoScroll={{ layoutShiftCompensation: false }}>
			<EditorCanvas
				underlyingComponent={EditorEditableCanvas}
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
		</RepeaterSortable>
	)
}
