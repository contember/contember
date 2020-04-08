import { EditorToolbar, ToolbarGroup } from '@contember/ui'
import * as React from 'react'
import { useSlate } from 'slate-react'
import { BaseEditor } from '../baseEditor'
import { ToolbarButton } from './ToolbarButton'

export interface HoveringToolbarContentsProps {
	buttons: ToolbarButton[] | ToolbarButton[][]
}

export const HoveringToolbarContents = React.memo(({ buttons: rawButtons }: HoveringToolbarContentsProps) => {
	const editor = useSlate() as BaseEditor

	if (!rawButtons.length) {
		return null
	}
	const buttons = (Array.isArray(rawButtons[0]) ? rawButtons : [rawButtons]) as ToolbarButton[][]
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
						onMouseDown: (e: React.MouseEvent) => {
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
