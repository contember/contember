import { ReactNode, useCallback, useMemo } from 'react'
import { EditorCanvas } from './common/editor-canvas'
import { EditorEditableCanvas } from './common/editor-editable-canvas'
import { BlockEditor, BlockEditorProps, withReferences } from '@contember/react-slate-editor'
import { Component, SugaredRelativeEntityList, SugaredRelativeSingleField } from '@contember/interface'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSlate, useSlateStatic } from 'slate-react'
import { blockEditorPlugins } from './plugins'
import { closestCenter, DndContext, DragEndEvent, KeyboardSensor, MeasuringStrategy, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core'
import { Transforms } from 'slate'

export type BlockEditorFieldProps =
	& BlockEditorProps
	& {
		referencesField: SugaredRelativeEntityList['field']
		referenceDiscriminationField: SugaredRelativeSingleField['field']
		placeholder?: string
	}

export const BlockEditorField = Component<BlockEditorFieldProps>(({ placeholder, children, ...props }) => {
	return (
		<BlockEditor {...props} plugins={[
			...blockEditorPlugins,
			...props.plugins ?? [],
			withReferences({
				field: props.referencesField,
				discriminationField: props.referenceDiscriminationField,
			}),
		]}>
			<SortableBlockEditor>
				<BlockEditorInner placeholder={placeholder}>
					{children}
				</BlockEditorInner>
			</SortableBlockEditor>
		</BlockEditor>
	)
})

const SortableBlockEditor = ({ children }: { children: ReactNode }) => {
	const sensors = useSensors(
		useSensor(MouseSensor),
		useSensor(TouchSensor),
		useSensor(KeyboardSensor),
	)

	const editor = useSlate()
	const onDragEnd = useCallback(({ active, over }: DragEndEvent) => {
		if (!over) {
			return
		}
		const activeNodeIndex = editor.children.findIndex(it => it.key === active.id)
		const overNodeIndex = editor.children.findIndex(it => it.key === over.id)

		if (activeNodeIndex === undefined || overNodeIndex === undefined || activeNodeIndex === overNodeIndex) {
			return
		}
		Transforms.moveNodes(editor, {
			at: [activeNodeIndex],
			to: [overNodeIndex],
		})
	}, [editor])

	const items = useMemo(() => {
		return editor.children.map(it => it.key as string)
	}, [editor.children])

	return (
		<DndContext
			sensors={sensors}
			measuring={{
				droppable: {
					strategy: MeasuringStrategy.Always,
				},
			}}
			onDragEnd={onDragEnd}
			collisionDetection={closestCenter}
		>
			<SortableContext items={items} strategy={verticalListSortingStrategy}>
				{children}
			</SortableContext>
		</DndContext>
	)
}

export const BlockEditorInner = ({ children, placeholder }: {
	placeholder?: string
	children: ReactNode
}) => {
	const editor = useSlateStatic()

	return (
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
	)
}
