import { Button, HoveringToolbar as UIToolbar, Icon } from '@contember/ui'
import * as React from 'react'
import { Editor, Range as SlateRange } from 'slate'
import { ReactEditor } from 'slate-react'
import { EditorNode, EditorWithBasicFormatting, EditorWithEssentials } from '../plugins'

export interface HoveringToolbarProps {
	selection: SlateRange | undefined
	editor: EditorWithBasicFormatting<EditorWithEssentials<EditorNode>>
}

export const HoveringToolbar = React.memo(({ selection, editor }: HoveringToolbarProps) => {
	const toolbarRef = React.useRef<HTMLDivElement | null>(null)

	let toolbarVisible = false

	if (selection) {
		toolbarVisible =
			ReactEditor.isFocused(editor) && SlateRange.isExpanded(selection) && Editor.string(editor, selection) !== ''
	}

	React.useLayoutEffect(() => {
		const container = toolbarRef.current

		if (!container) {
			return
		}

		const domSelection = getSelection()

		let top, left

		if (!toolbarVisible || !selection || !domSelection || !domSelection.rangeCount || domSelection.isCollapsed) {
			top = '-1000vh'
			left = '-1000vw'
		} else {
			const domRange = domSelection.getRangeAt(0)
			const rect = domRange.getBoundingClientRect()
			top = `${rect.top + window.pageYOffset - container.offsetHeight}px`
			left = `${rect.left + window.pageXOffset - container.offsetWidth / 2 + rect.width / 2}px`
		}

		container.style.top = top
		container.style.left = left
	}, [selection, toolbarVisible])

	const isBold = editor.isBold(editor)
	const toggleBold = React.useCallback(() => {
		editor.toggleBold(editor)
	}, [editor])
	const boldButton = React.useMemo(
		() => (
			<Button key="bold" isActive={isBold} onClick={toggleBold}>
				<Icon blueprintIcon="bold" />
			</Button>
		),
		[isBold, toggleBold],
	)

	const isStruckThrough = editor.isStruckThrough(editor)
	const toggleStruckThrough = React.useCallback(() => {
		editor.toggleStruckThrough(editor)
	}, [editor])
	const strikethroughButton = React.useMemo(
		() => (
			<Button key="strikethrough" isActive={isStruckThrough} onClick={toggleStruckThrough}>
				<Icon blueprintIcon="strikethrough" />
			</Button>
		),
		[isStruckThrough, toggleStruckThrough],
	)

	// TODO
	const linkButton = React.useMemo(
		() => (
			<Button key="link">
				<Icon blueprintIcon="link" />
			</Button>
		),
		[],
	)

	const buttons = React.useMemo(() => [boldButton, strikethroughButton, linkButton], [
		boldButton,
		//linkButton,
		strikethroughButton,
	])

	// TODO use a container so that it doesn't break during resize.
	return (
		<UIToolbar isActive={toolbarVisible} ref={toolbarRef}>
			{buttons}
		</UIToolbar>
	)
})
HoveringToolbar.displayName = 'HoveringToolbar'
