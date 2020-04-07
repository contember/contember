import { useForceRender } from '@contember/react-utils'
import { EditorToolbar } from '@contember/ui'
import { ToolbarButton } from '@contember/ui/src/components/editor/EditorToolbarButton'
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

	const buttons: ToolbarButton[] = []

	if (editor.canToggleMarks({ isBold: true })) {
		buttons.push({
			isActive: isBold,
			onClick: toggleBold,
			label: 'bold',
			blueprintIcon: 'bold',
		})
	}

	if (editor.canToggleMarks({ isItalic: true })) {
		buttons.push({
			isActive: isItalic,
			onClick: toggleItalic,
			label: 'italic',
			blueprintIcon: 'italic',
		})
	}

	if (editor.canToggleMarks({ isUnderlined: true })) {
		buttons.push({
			isActive: isUnderlined,
			onClick: toggleUnderlined,
			label: 'underlined',
			blueprintIcon: 'underline',
		})
	}

	if (editor.canToggleMarks({ isStruckThrough: true })) {
		buttons.push({
			isActive: isStruckThrough,
			onClick: toggleStruckThrough,
			label: 'strikethrough',
			blueprintIcon: 'strikethrough',
		})
	}

	buttons.push({
		isActive: isAnchor,
		onClick: toggleAnchor,
		label: 'link',
		blueprintIcon: 'link',
	})

	if (editor.canToggleMarks({ isCode: true })) {
		buttons.push({
			isActive: isCode,
			onClick: toggleCode,
			label: 'code',
			blueprintIcon: 'code',
		})
	}

	buttons.push({
		isActive: isHeading1,
		onClick: toggleHeading1,
		label: 'header-one',
		blueprintIcon: 'header-one',
	})

	buttons.push({
		isActive: isHeading2,
		onClick: toggleHeading2,
		label: 'header-two',
		blueprintIcon: 'header-two',
	})

	return <EditorToolbar scope="contextual" groups={[{ buttons }]} />
})
InlineHoveringToolbarContents.displayName = 'InlineHoveringToolbarContents'
