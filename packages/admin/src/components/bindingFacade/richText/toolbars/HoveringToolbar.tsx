import { Button, HoveringToolbar as UIToolbar, Icon } from '@contember/ui'
import * as React from 'react'
import { Editor, Range } from 'slate'
import { ReactEditor } from 'slate-react'
import { EditorNode, EditorWithBasicFormatting, EditorWithEssentials } from '../plugins'

export interface HoveringToolbarProps {
	selection: Range | undefined
	editor: EditorWithBasicFormatting<EditorWithEssentials<EditorNode>>
}

export const HoveringToolbar = React.memo(({ selection, editor }: HoveringToolbarProps) => {
	const toolbarRef = React.useRef<HTMLDivElement | null>(null)

	let toolbarVisible = false

	if (selection) {
		toolbarVisible =
			ReactEditor.isFocused(editor) && Range.isExpanded(selection) && Editor.string(editor, selection) !== ''
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

	return (
		<UIToolbar isActive={toolbarVisible} ref={toolbarRef}>
			<Button>
				<Icon blueprintIcon="bold" />
			</Button>
			<Button>
				<Icon blueprintIcon="strikethrough" />
			</Button>
			<Button>
				<Icon blueprintIcon="link" />
			</Button>
		</UIToolbar>
	)
})
HoveringToolbar.displayName = 'HoveringToolbar'
