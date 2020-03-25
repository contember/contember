import { Button, Icon } from '@contember/ui'
import * as React from 'react'
import { useSlate } from 'slate-react'
import { useForceRender } from '@contember/react-utils'
import { RichTextBooleanMarkNames } from '../../plugins'
import { BlockSlateEditor } from '../editor'

export interface InlineHoveringToolbarContentsProps {}

const onMouseDownCommon = (e: React.MouseEvent) => {
	e.preventDefault() // This is crucial so that we don't unselect the selected text
	e.nativeEvent.stopPropagation() // This is a bit of a hack ‒ so that we don't register this click as a start of a new selection
}

const toggleMark = (editor: BlockSlateEditor, mark: RichTextBooleanMarkNames, e: React.MouseEvent) => {
	onMouseDownCommon(e)
	editor.toggleRichTextNodeMark(editor, mark)
}

export const InlineHoveringToolbarContents = React.memo((props: InlineHoveringToolbarContentsProps) => {
	const editor = useSlate() as BlockSlateEditor
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

	const isCode = editor.isCode(editor)
	const toggleCode = React.useCallback(
		(e: React.MouseEvent) => {
			toggleMark(editor, 'isCode', e)
			forceRender()
		},
		[editor, forceRender],
	)

	const isHeading1 = editor.isWithinHeading({ level: 1 })
	const toggleHeading1 = React.useCallback(
		(e: React.MouseEvent) => {
			onMouseDownCommon(e)
			editor.toggleHeading({ level: 1 })
		},
		[editor],
	)

	const isHeading2 = editor.isWithinHeading({ level: 2 })
	const toggleHeading2 = React.useCallback(
		(e: React.MouseEvent) => {
			onMouseDownCommon(e)
			editor.toggleHeading({ level: 2 })
		},
		[editor],
	)

	return (
		<>
			{editor.canSetBold(editor) && (
				<Button key="bold" isActive={isBold} onMouseDown={toggleBold}>
					<Icon blueprintIcon="bold" />
				</Button>
			)}
			{editor.canSetItalic(editor) && (
				<Button key="italic" isActive={isItalic} onMouseDown={toggleItalic}>
					<Icon blueprintIcon="italic" />
				</Button>
			)}
			{editor.canSetUnderlined(editor) && (
				<Button key="underlined" isActive={isUnderlined} onMouseDown={toggleUnderlined}>
					<Icon blueprintIcon="underline" />
				</Button>
			)}
			{editor.canSetStruckThrough(editor) && (
				<Button key="strikethrough" isActive={isStruckThrough} onMouseDown={toggleStruckThrough}>
					<Icon blueprintIcon="strikethrough" />
				</Button>
			)}
			<Button key="link" isActive={isAnchor} onMouseDown={toggleAnchor}>
				<Icon blueprintIcon="link" />
			</Button>
			{editor.canSetCode(editor) && (
				<Button key="code" isActive={isCode} onMouseDown={toggleCode}>
					<Icon blueprintIcon="code" />
				</Button>
			)}
			<Button key="heading-1" isActive={isHeading1} onMouseDown={toggleHeading1}>
				<Icon blueprintIcon="header-one" />
			</Button>
			<Button key="heading-2" isActive={isHeading2} onMouseDown={toggleHeading2}>
				<Icon blueprintIcon="header-two" />
			</Button>
		</>
	)
})
InlineHoveringToolbarContents.displayName = 'InlineHoveringToolbarContents'
