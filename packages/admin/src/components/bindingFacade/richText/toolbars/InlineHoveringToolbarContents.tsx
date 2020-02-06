import { Button, Icon } from '@contember/ui'
import * as React from 'react'
import { useEditor } from 'slate-react'
import { useForceRender } from '../../../../utils'
import { RichTextBooleanMarkNames } from '../plugins/basicFormatting'
import { HoveringToolbarEditor } from './HoveringToolbarEditor'

export interface InlineHoveringToolbarContentsProps {}

const toggleMark = (editor: HoveringToolbarEditor, mark: RichTextBooleanMarkNames, e: React.MouseEvent) => {
	e.preventDefault() // This is crucial so that we don't unselect the selected text
	e.nativeEvent.stopPropagation() // This is a bit of a hack ‒ so that we don't register this click as a start of a new selection
	editor.toggleRichTextNodeMark(editor, mark)
}

export const InlineHoveringToolbarContents = React.memo((props: InlineHoveringToolbarContentsProps) => {
	const editor = useEditor() as HoveringToolbarEditor
	const forceRender = useForceRender()

	const isBold = editor.isBold(editor)
	const toggleBold = React.useCallback(
		(e: React.MouseEvent) => {
			toggleMark(editor, 'isBold', e)
			forceRender()
		},
		[editor, forceRender],
	)

	const isItalic = editor.isItalic(editor)
	const toggleItalic = React.useCallback(
		(e: React.MouseEvent) => {
			toggleMark(editor, 'isItalic', e)
			forceRender()
		},
		[editor, forceRender],
	)

	const isUnderlined = editor.isUnderlined(editor)
	const toggleUnderlined = React.useCallback(
		(e: React.MouseEvent) => {
			toggleMark(editor, 'isUnderlined', e)
			forceRender()
		},
		[editor, forceRender],
	)

	const isStruckThrough = editor.isStruckThrough(editor)
	const toggleStruckThrough = React.useCallback(
		(e: React.MouseEvent) => {
			toggleMark(editor, 'isStruckThrough', e)
			forceRender()
		},
		[editor, forceRender],
	)

	const isAnchor = editor.isAnchorActive(editor)
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
			<Button key="italic" isActive={isItalic} onMouseDown={toggleItalic}>
				<Icon blueprintIcon="italic" />
			</Button>
			<Button key="underlined" isActive={isUnderlined} onMouseDown={toggleUnderlined}>
				<Icon blueprintIcon="underline" />
			</Button>
			<Button key="strikethrough" isActive={isStruckThrough} onMouseDown={toggleStruckThrough}>
				<Icon blueprintIcon="strikethrough" />
			</Button>
			<Button key="link" isActive={isAnchor} onMouseDown={toggleAnchor}>
				<Icon blueprintIcon="link" />
			</Button>
		</>
	)
})
InlineHoveringToolbarContents.displayName = 'InlineHoveringToolbarContents'
