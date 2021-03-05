import { AccessorProvider, useBindingOperations, useEnvironment, VariableInputTransformer } from '@contember/binding'
import { Dropdown, EditorToolbar, Icon, ToolbarGroup } from '@contember/ui'
import { memo, MouseEvent as ReactMouseEvent, useCallback, useState } from 'react'
import { Range as SlateRange } from 'slate'
import { useEditor, useSlate } from 'slate-react'
import { BaseEditor } from '../baseEditor'
import { BlockSlateEditor } from '../blockEditor'
import { InitializeReferenceToolbarButton, ToolbarButtonSpec } from './ToolbarButtonSpec'

export interface HoveringToolbarContentsProps {
	buttons: ToolbarButtonSpec[] | ToolbarButtonSpec[][]
}

const RefButton = memo(({ button }: { button: InitializeReferenceToolbarButton }) => {
	const editor = useEditor() as BlockSlateEditor
	const environment = useEnvironment()
	const bindingOperations = useBindingOperations()

	const [editorSelection, setEditorSelection] = useState<SlateRange | null>(null)
	const [referenceId, setReferenceId] = useState<string | undefined>(undefined)

	const Content = button.referenceContent
	return (
		<Dropdown
			onDismiss={useCallback(() => {
				if (referenceId === undefined) {
					return
				}
				setEditorSelection(null)
				setReferenceId(undefined)
				bindingOperations.batchDeferredUpdates(() => editor.getReferencedEntity(referenceId).deleteEntity())
			}, [bindingOperations, editor, referenceId])}
			renderToggle={({ ref, onClick }) => (
				<Icon
					blueprintIcon={button.blueprintIcon}
					contemberIcon={button.contemberIcon}
					customIcon={button.customIcon}
					ref={ref}
					onClick={e => {
						if (referenceId) {
							return
						}
						const discriminateBy = VariableInputTransformer.transformValue(button.discriminateBy, environment)

						// const preppedPath = editor.prepareElementForInsertion({
						// 	type: button,
						// })
						const preppedPath = editorSelection?.focus.path || [] // TODO this is awful.
						setReferenceId(editor.createElementReference(preppedPath, discriminateBy, button.initializeReference))
						setEditorSelection(editor.selection)
						onClick(e)
					}}
				/>
			)}
		>
			{({ requestClose }) => {
				if (referenceId === undefined) {
					return null
				}
				const cleanUp = () => {
					requestClose()
					setEditorSelection(null)
					setReferenceId(undefined)
				}
				return (
					<AccessorProvider accessor={editor.getReferencedEntity(referenceId)}>
						<Content
							referenceId={referenceId}
							editor={editor}
							selection={editorSelection}
							onSuccess={cleanUp}
							onCancel={() => {
								bindingOperations.batchDeferredUpdates(() =>
									bindingOperations.batchDeferredUpdates(() => editor.getReferencedEntity(referenceId).deleteEntity()),
								)
								cleanUp()
							}}
						/>
					</AccessorProvider>
				)
			}}
		</Dropdown>
	)
})

export const HoveringToolbarContents = memo(({ buttons: rawButtons }: HoveringToolbarContentsProps) => {
	const editor = useSlate() as BaseEditor

	if (!rawButtons.length) {
		return null
	}
	const buttons = (Array.isArray(rawButtons[0]) ? rawButtons : [rawButtons]) as ToolbarButtonSpec[][]
	const groups: ToolbarGroup[] = buttons.map(
		(buttons): ToolbarGroup => ({
			buttons: buttons
				.map((button): ToolbarGroup['buttons'][number] | undefined => {
					let shouldDisplay: boolean
					let isActive: boolean
					let onMouseDown: () => void

					if ('marks' in button) {
						shouldDisplay = editor.canToggleMarks(button.marks)
						isActive = editor.hasMarks(button.marks)
						onMouseDown = () => {
							editor.toggleMarks(button.marks)
						}
					} else if ('elementType' in button) {
						shouldDisplay = editor.canToggleElement(button.elementType, button.suchThat)
						isActive = editor.isElementActive(button.elementType, button.suchThat)
						onMouseDown = () => {
							editor.toggleElement(button.elementType, button.suchThat)
						}
					} else if ('referenceContent' in button) {
						return {
							label: button.title,
							isActive: false,
							//onMouseDown: (e: MouseEvent) => {
							//	e.preventDefault() // This is crucial so that we don't unselect the selected text
							//	e.nativeEvent.stopPropagation() // This is a bit of a hack ‒ so that we don't register this click as a start of a new selection
							//},
							customIcon: <RefButton button={button} />,
						}
					} else {
						return undefined
					}

					if (!shouldDisplay) {
						return undefined
					}

					return {
						label: button.title,
						//layout?: ToolbarButtonLayout
						isActive,
						onMouseDown: (e: ReactMouseEvent) => {
							e.preventDefault() // This is crucial so that we don't unselect the selected text
							e.nativeEvent.stopPropagation() // This is a bit of a hack ‒ so that we don't register this click as a start of a new selection
							onMouseDown()
						},
						blueprintIcon: button.blueprintIcon,
						contemberIcon: button.contemberIcon,
						customIcon: button.customIcon,
					}
				})
				.filter<ToolbarGroup['buttons'][number]>((item): item is ToolbarGroup['buttons'][number] => !!item),
		}),
	)

	return <EditorToolbar groups={groups} scope="contextual" />
})
