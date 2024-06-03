import { memo, ReactNode, useLayoutEffect, useRef } from 'react'
import { ReactEditor, useSlateSelection, useSlateStatic } from 'slate-react'

export interface InlineHoveringToolbarProps {
	children: ReactNode
}

export const InlineHoveringToolbar = memo(({ children }: InlineHoveringToolbarProps) => {
	const ref = useRef<HTMLDivElement | null>(null)
	const editor = useSlateStatic()
	const selection = useSlateSelection()
	useLayoutEffect(() => {
		const toolbar = ref.current
		if (!toolbar) {
			return
		}

		if (selection && selection.focus.offset !== selection.anchor.offset) {
			const domRange = ReactEditor.toDOMRange(editor, selection)
			const domRect = domRange.getBoundingClientRect()
			toolbar.style.top = `${domRect.top + window.scrollY - toolbar.offsetHeight}px`
			toolbar.style.left = `${Math.min(
				Math.max(0, document.documentElement.clientWidth - toolbar.offsetWidth),
				Math.max(0, domRect.left + window.scrollX - toolbar.offsetWidth / 2 + domRect.width / 2),
			)
			}px`
			toolbar.style.maxWidth = `${document.documentElement.clientWidth}px`
		} else {
			toolbar.style.top = '-1000vh'
			toolbar.style.left = '-1000vw'
			toolbar.style.maxWidth = 'unset'
		}

	}, [editor, selection])

	return (
		<>
				<div className="fixed" ref={ref}>
					<div className="p-1 rounded-xl shadow-md border bg-white space-x-1 ">
						{children}
					</div>
				</div>
		</>
	)
})
