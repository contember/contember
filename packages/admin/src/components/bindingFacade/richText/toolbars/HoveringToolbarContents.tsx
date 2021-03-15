import {
	AccessorProvider,
	BindingOperationsProvider,
	useBindingOperations,
	useEnvironment,
	VariableInputTransformer,
} from '@contember/binding'
import { EditorToolbar, ToolbarGroup, useDialog } from '@contember/ui'
import { memo, MouseEvent as ReactMouseEvent } from 'react'
import { Transforms } from 'slate'
import { useSlate } from 'slate-react'
import { BlockSlateEditor } from '../blockEditor'
import { ToolbarButtonSpec } from './ToolbarButtonSpec'

export interface HoveringToolbarContentsProps {
	buttons: ToolbarButtonSpec[] | ToolbarButtonSpec[][]
}

export const HoveringToolbarContents = memo(({ buttons: rawButtons }: HoveringToolbarContentsProps) => {
	const editor = useSlate() as BlockSlateEditor
	const { openDialog } = useDialog()
	const environment = useEnvironment()
	const bindingOperations = useBindingOperations()

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
							const referenceId = editor.createElementReference(targetPath, discriminateBy, button.initializeReference)

							try {
								const Content = button.referenceContent
								await openDialog({
									heading: button.label,
									content: props => {
										return (
											<BindingOperationsProvider
												bindingOperations={
													// TODO get rid of this.
													// This is NOT public api. Don't use BindingOperationsProvider.
													bindingOperations
												}
											>
												<AccessorProvider accessor={editor.getReferencedEntity(referenceId)}>
													<Content
														referenceId={referenceId}
														editor={editor}
														selection={selection}
														onSuccess={() => props.resolve(undefined)}
														onCancel={() => props.reject()}
													/>
												</AccessorProvider>
											</BindingOperationsProvider>
										)
									},
								})
							} catch {
								editor.getReferencedEntity(referenceId).deleteEntity()
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
