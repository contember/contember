import { Button, ButtonGroup, Icon } from '@contember/ui'
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

	return (
		<>
			{buttons.map((buttons, i) => {
				return (
					<ButtonGroup key={i}>
						{buttons.map((button, j) => {
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
								return <React.Fragment key={j} />
							}

							if (!shouldDisplay) {
								return <React.Fragment key={j} />
							}

							return (
								<Button
									key={j}
									isActive={isActive}
									title={button.title} // TODO add tooltip support
									onMouseDown={(e: React.MouseEvent) => {
										e.preventDefault() // This is crucial so that we don't unselect the selected text
										e.nativeEvent.stopPropagation() // This is a bit of a hack ‒ so that we don't register this click as a start of a new selection
										onMouseDown()
									}}
								>
									<Icon
										blueprintIcon={button.blueprintIcon}
										contemberIcon={button.contemberIcon}
										customIcon={button.customIcon}
									/>
								</Button>
							)
						})}
					</ButtonGroup>
				)
			})}
		</>
	)
})
