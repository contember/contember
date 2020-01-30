import { Button, HoveringToolbar as UIToolbar, Icon } from '@contember/ui'
import * as React from 'react'
import { Editor, Range as SlateRange } from 'slate'
import { ReactEditor, useEditor } from 'slate-react'
import {
	EditorNode,
	EditorWithAnchors,
	EditorWithBasicFormatting,
	EditorWithEssentials,
	RichTextBooleanMarkNames,
} from '../plugins'

type HoveringToolbarEditor = EditorWithAnchors<EditorWithBasicFormatting<EditorWithEssentials<EditorNode>>>

export interface HoveringToolbarProps {
	selection: SlateRange | undefined
}

const getToggleCallback = (editor: HoveringToolbarEditor, mark: RichTextBooleanMarkNames) => (
	e: React.SyntheticEvent,
) => {
	e.preventDefault() // This is crucial so that we don't unselect the selected text
	editor.toggleRichTextNodeMark(editor, mark)
}

export const HoveringToolbar = React.memo(({ selection }: HoveringToolbarProps) => {
	const editor = useEditor() as HoveringToolbarEditor
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
	const toggleBold = React.useMemo(() => getToggleCallback(editor, 'isBold'), [editor])
	const boldButton = React.useMemo(
		() => (
			<Button key="bold" isActive={isBold} onMouseDown={toggleBold}>
				<Icon blueprintIcon="bold" />
			</Button>
		),
		[isBold, toggleBold],
	)

	const isStruckThrough = editor.isStruckThrough(editor)
	const toggleStruckThrough = React.useMemo(() => getToggleCallback(editor, 'isStruckThrough'), [editor])
	const strikethroughButton = React.useMemo(
		() => (
			<Button key="strikethrough" isActive={isStruckThrough} onMouseDown={toggleStruckThrough}>
				<Icon blueprintIcon="strikethrough" />
			</Button>
		),
		[isStruckThrough, toggleStruckThrough],
	)

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
	const anchorButton = React.useMemo(
		() => (
			<Button key="link" onMouseDown={toggleAnchor}>
				<Icon blueprintIcon="link" />
			</Button>
		),
		[toggleAnchor],
	)

	const buttons = React.useMemo(() => [boldButton, strikethroughButton, anchorButton], [
		boldButton,
		strikethroughButton,
		anchorButton,
	])

	// TODO use a container so that it doesn't break during resize.
	return (
		<UIToolbar isActive={toolbarVisible} ref={toolbarRef}>
			{buttons}
		</UIToolbar>
	)
})
HoveringToolbar.displayName = 'HoveringToolbar'
