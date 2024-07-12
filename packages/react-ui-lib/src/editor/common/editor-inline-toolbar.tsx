import { memo, ReactNode, useLayoutEffect, useRef } from 'react'
import { ReactEditor, useSlateSelection, useSlateStatic } from 'slate-react'

export interface EditorInlineToolbarProps {
	children: ReactNode
}

export const EditorInlineToolbar = memo(({ children }: EditorInlineToolbarProps) => {
	const ref = useRef<HTMLDivElement | null>(null)
	const editor = useSlateStatic()
	const selection = useSlateSelection()
	useLayoutEffect(() => {
		const toolbar = ref.current
		if (!toolbar) {
			return
		}

		if (selection && selection.focus.offset !== selection.anchor.offset) {
			const borderWidth = 1
			const domRange = ReactEditor.toDOMRange(editor, selection)
			let parent = toolbar.parentElement
			while (parent && getComputedStyle(parent).position !== 'relative') {
				parent = parent.parentElement
			}

			if (!parent) {
				return
			}

			const parentRect = parent.getBoundingClientRect()
			const rangeRect = domRange.getBoundingClientRect()
			const toolbarRect = toolbar.getBoundingClientRect()

			const top = rangeRect.top - parentRect.top - toolbarRect.height
			const left = Math.min(
				Math.max(0, document.documentElement.clientWidth - toolbar.offsetWidth),
				Math.max(
					0,
					Math.min(parentRect.width - toolbar.offsetWidth - borderWidth * 2, rangeRect.left - parentRect.left - toolbar.offsetWidth / 2 + rangeRect.width / 2),
				),
			)
			toolbar.style.top = `${top}px`
			toolbar.style.left = `${left}px`

			toolbar.style.maxWidth = `${document.documentElement.clientWidth}px`
		} else {
			toolbar.style.top = '-1000vh'
			toolbar.style.left = '-1000vw'
			toolbar.style.maxWidth = 'unset'
		}
	}, [editor, selection])

	return (
		<>
			<div className="absolute p-2" ref={ref}>
				<div className="p-1 rounded-xl shadow-md border bg-white space-x-1">{children}</div>
			</div>
		</>
	)
})
