import * as React from 'react'
import { HoverMenu } from './HoverMenu'
import { Editor } from 'slate'
import { BlocksDefinitions, InlinesDefinitions, MarksDefinitions, WithHoverMenu } from './types'
import { HoverMenuItem } from './HoverMenuItem'

export interface HoverMenuManagerProps {
	editor: Editor
	blocks: BlocksDefinitions
	marks: MarksDefinitions
	inlines?: InlinesDefinitions
}

export const HoverMenuManager: React.FC<HoverMenuManagerProps> = ({ editor, marks, inlines }) => {
	const selection = editor.value.selection

	const renderEntries = (
		entries: WithHoverMenu,
		isActive: (name: string) => boolean,
		toggle: (name: string) => void
	): React.ReactNode => {
		return (
			<>
				{Object.entries(entries).map(
					([name, def]) =>
						def.menuButton && (
							<HoverMenuItem key={name} isActive={isActive(name)} onClick={() => toggle(name)}>
								{def.menuButton()}
							</HoverMenuItem>
						)
				)}
			</>
		)
	}

	return (
		<HoverMenu selection={selection}>
			{renderEntries(
				marks,
				markType => editor.value.activeMarks.some(mark => (mark ? mark.type == markType : false)),
				markType => {
					editor.toggleMark(markType)
				}
			)}
			{inlines &&
				renderEntries(
					inlines,
					type => editor.value.inlines.some(inline => (inline ? inline.type == type : false)),
					type => {
						editor.wrapInline(type)
					}
				)}
		</HoverMenu>
	)
}
