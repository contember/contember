import { useForceRender } from '@contember/react-utils'
import { Button, Icon, ButtonGroup } from '@contember/ui'
import * as React from 'react'
import { useSlate } from 'slate-react'

export interface InlineHoveringToolbarContentsProps {}

const onMouseDownCommon = (e: React.MouseEvent) => {
	e.preventDefault() // This is crucial so that we don't unselect the selected text
	e.nativeEvent.stopPropagation() // This is a bit of a hack ‒ so that we don't register this click as a start of a new selection
}

const toggleMark = (editor: any, mark: string, e: React.MouseEvent) => {
	onMouseDownCommon(e)
	editor.toggleMarks({ [mark]: true })
}

export const InlineHoveringToolbarContents = React.memo((props: InlineHoveringToolbarContentsProps) => {
	const editor = useSlate() as any
	const forceRender = useForceRender()

	const isBold = editor.hasMarks({ isBold: true })
	const toggleBold = React.useCallback(
		(e: React.MouseEvent) => {
			toggleMark(editor, 'isBold', e)
			forceRender()
		},
		[editor, forceRender],
	)

	const isItalic = editor.hasMarks({ isItalic: true })
	const toggleItalic = React.useCallback(
		(e: React.MouseEvent) => {
			toggleMark(editor, 'isItalic', e)
			forceRender()
		},
		[editor, forceRender],
	)

	const isUnderlined = editor.hasMarks({ isUnderlined: true })
	const toggleUnderlined = React.useCallback(
		(e: React.MouseEvent) => {
			toggleMark(editor, 'isUnderlined', e)
			forceRender()
		},
		[editor, forceRender],
	)

	const isStruckThrough = editor.hasMarks({ isStruckThrough: true })
	const toggleStruckThrough = React.useCallback(
		(e: React.MouseEvent) => {
			toggleMark(editor, 'isStruckThrough', e)
			forceRender()
		},
		[editor, forceRender],
	)

	const isAnchor = editor.isElementActive('anchor')
	const toggleAnchor = React.useCallback(
		(e: React.SyntheticEvent) => {
			e.preventDefault()
			editor.toggleElement('anchor')
		},
		[editor],
	)

	const isCode = editor.hasMarks({ isCode: true })
	const toggleCode = React.useCallback(
		(e: React.MouseEvent) => {
			toggleMark(editor, 'isCode', e)
			forceRender()
		},
		[editor, forceRender],
	)

	const isHeading1 = editor.isElementActive('heading', { level: 1 })
	const toggleHeading1 = React.useCallback(
		(e: React.MouseEvent) => {
			onMouseDownCommon(e)
			editor.toggleElement('heading', { level: 1 })
		},
		[editor],
	)

	const isHeading2 = editor.isElementActive('heading', { level: 2 })
	const toggleHeading2 = React.useCallback(
		(e: React.MouseEvent) => {
			onMouseDownCommon(e)
			editor.toggleElement('heading', { level: 2 })
		},
		[editor],
	)

	return (
		<ButtonGroup>
			{editor.canToggleMarks({ isBold: true }) && (
				<Button key="bold" isActive={isBold} onMouseDown={toggleBold}>
					<Icon blueprintIcon="bold" />
				</Button>
			)}
			{editor.canToggleMarks({ isItalic: true }) && (
				<Button key="italic" isActive={isItalic} onMouseDown={toggleItalic}>
					<Icon blueprintIcon="italic" />
				</Button>
			)}
			{editor.canToggleMarks({ isUnderlined: true }) && (
				<Button key="underlined" isActive={isUnderlined} onMouseDown={toggleUnderlined}>
					<Icon blueprintIcon="underline" />
				</Button>
			)}
			{editor.canToggleMarks({ isStruckThrough: true }) && (
				<Button key="strikethrough" isActive={isStruckThrough} onMouseDown={toggleStruckThrough}>
					<Icon blueprintIcon="strikethrough" />
				</Button>
			)}
			<Button key="link" isActive={isAnchor} onMouseDown={toggleAnchor}>
				<Icon blueprintIcon="link" />
			</Button>
			{editor.canToggleMarks({ isCode: true }) && (
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
		</ButtonGroup>
	)
})
InlineHoveringToolbarContents.displayName = 'InlineHoveringToolbarContents'
