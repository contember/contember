import { Button, Icon } from '@contember/ui'
import * as React from 'react'
import { useEditor } from 'slate-react'
import { RichTextBooleanMarkNames } from '../plugins/basicFormatting'
import { HoveringToolbarEditor } from './HoveringToolbarEditor'

export interface InlineHoveringToolbarContentsProps {}

const getToggleCallback = (editor: HoveringToolbarEditor, mark: RichTextBooleanMarkNames) => (
	e: React.SyntheticEvent,
) => {
	e.preventDefault() // This is crucial so that we don't unselect the selected text
	editor.toggleRichTextNodeMark(editor, mark)
}

export const InlineHoveringToolbarContents = React.memo((props: InlineHoveringToolbarContentsProps) => {
	const editor = useEditor() as HoveringToolbarEditor

	const isBold = editor.isBold(editor)
	const toggleBold = () => getToggleCallback(editor, 'isBold')

	const isStruckThrough = editor.isStruckThrough(editor)
	const toggleStruckThrough = () => getToggleCallback(editor, 'isStruckThrough')

	const toggleAnchor = React.useCallback(
		(e: React.SyntheticEvent) => {
			e.preventDefault()
			const url = prompt('Insert the URL:')
			if (!url) {
				return
			}
			editor.wrapAnchor(editor, url)
		},
		[editor],
	)

	return (
		<>
			<Button key="bold" isActive={isBold} onMouseDown={toggleBold}>
				<Icon blueprintIcon="bold" />
			</Button>
			<Button key="strikethrough" isActive={isStruckThrough} onMouseDown={toggleStruckThrough}>
				<Icon blueprintIcon="strikethrough" />
			</Button>
			<Button key="link" onMouseDown={toggleAnchor}>
				<Icon blueprintIcon="link" />
			</Button>
		</>
	)
})
InlineHoveringToolbarContents.displayName = 'InlineHoveringToolbarContents'
