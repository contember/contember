import { Entity, useEnvironment, VariableInputTransformer } from '@contember/binding'
import { EditorToolbar, EditorToolbarProps, ToolbarGroup, useDialog } from '@contember/ui'
import { memo, MouseEvent as ReactMouseEvent } from 'react'
import { Transforms } from 'slate'
import { useSlate } from 'slate-react'
import type { EditorWithBlocks } from '../blockEditor'
import { referenceElementType } from '../blockEditor'
import { EditorTransforms } from '../slate-reexport'
import type { ToolbarButtonSpec } from './ToolbarButtonSpec'

export interface HoveringToolbarContentsProps {
	buttons: ToolbarButtonSpec[] | ToolbarButtonSpec[][]
	showLabels?: EditorToolbarProps['showLabels']
}

export const HoveringToolbarContents = memo(({ buttons: rawButtons, showLabels }: HoveringToolbarContentsProps) => {
	const editor = useSlate() as EditorWithBlocks
	const { openDialog } = useDialog<true>()
	const environment = useEnvironment()

	if (!rawButtons.length) {
		return null
	}
	const buttons = (Array.isArray(rawButtons[0]) ? rawButtons : [rawButtons]) as ToolbarButtonSpec[][]
	const groups: ToolbarGroup[] = buttons
		.map(
			(buttons): ToolbarGroup => ({
				buttons: buttons
					.map((button): ToolbarGroup['buttons'][number] | undefined => {
						let shouldDisplay: boolean
						let isActive: boolean
						let onMouseDown: () => void
						if ('toggle' in button) {
							shouldDisplay = button.shouldDisplay?.({ editor }) ?? true
							isActive = button.isActive?.({ editor }) ?? false
							onMouseDown = () => {
								button.toggle({ editor })
							}
						} else if ('marks' in button) {
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
							shouldDisplay = true // TODO
							isActive = false
							onMouseDown = async () => {
								const discriminateBy = VariableInputTransformer.transformValue(button.discriminateBy, environment)
								const selection = editor.selection
								const targetPath = selection?.focus.path // TODO this is awful.

								if (targetPath === undefined) {
									return
								}

								Transforms.deselect(editor)
								const reference = editor.createElementReference(
									targetPath,
									discriminateBy,
									button.initializeReference,
								)

								const Content = button.referenceContent
								const result = await openDialog({
									heading: button.label,
									content: props => (
										<Entity accessor={reference}>
											<Content
												referenceId={reference.id}
												editor={editor}
												selection={selection}
												onSuccess={({ createElement } = {}) => {
													if (createElement !== undefined) {
														if (!selection) {
															return
														}
														EditorTransforms.select(editor, selection)
														EditorTransforms.wrapNodes(
															editor,
															{
																type: referenceElementType,
																children: [{ text: '' }],
																referenceId: reference.id,
																...createElement,
															},
															{ split: true },
														)
														EditorTransforms.collapse(editor, { edge: 'end' })
													}
													props.resolve(true)
												}}
												onCancel={() => props.resolve()}
											/>
										</Entity>
									),
								})
								if (result !== true) {
									reference.deleteEntity()
								}
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
							onClick: (e: ReactMouseEvent) => {
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
		.filter(item => item.buttons.length)

	return (
		<EditorToolbar
			groups={groups}
			scope="contextual"
			showLabels={showLabels}
		/>
	)
})
