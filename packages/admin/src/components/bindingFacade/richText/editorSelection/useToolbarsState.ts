import { RefObject, useLayoutEffect, useRef } from 'react'
import { useEditorSelection } from './useEditorSelection'

export interface ToolbarsState {
	inlineToolbarRef: RefObject<HTMLDivElement>
	inlineToolbarActive: boolean
	blockToolbarActive: boolean
}

// TODO use a container so that it doesn't break during resize.
export const useToolbarState = (): ToolbarsState => {
	const inlineToolbarRef = useRef<HTMLDivElement>(null)
	const selectionState = useEditorSelection()

	const inlineToolbarActive =
		selectionState.name === 'expandedPointerSelection' || selectionState.name === 'expandedNonPointerSelection'
	const blockToolbarActive =
		selectionState.name === 'collapsedSelection' || selectionState.name === 'emergingPointerSelection'

	useLayoutEffect(() => {
		const container = inlineToolbarRef.current

		if (!container) {
			return
		}

		let top, left
		let domRangeRect: DOMRect | undefined

		if (selectionState.name === 'expandedNonPointerSelection') {
			domRangeRect = selectionState.selection.getRangeAt(0).getBoundingClientRect()
		} else if (selectionState.name === 'expandedPointerSelection') {
			if (document.caretRangeFromPoint) {
				domRangeRect =
					document
						.caretRangeFromPoint(selectionState.finishEvent.clientX, selectionState.finishEvent.clientY)
						?.getBoundingClientRect() || undefined
			} else {
				domRangeRect =
					document
						.caretPositionFromPoint(selectionState.finishEvent.clientX, selectionState.finishEvent.clientY)
						?.getClientRect() || undefined
			}
		}
		if (domRangeRect) {
			top = `${domRangeRect.top + window.pageYOffset - container.offsetHeight}px`
			left = `${domRangeRect.left + window.pageXOffset - container.offsetWidth / 2 + domRangeRect.width / 2}px`
		} else {
			top = '-1000vh'
			left = '-1000vw'
		}

		container.style.top = top
		container.style.left = left
	}, [selectionState])

	return {
		inlineToolbarRef,
		blockToolbarActive,
		inlineToolbarActive,
	}
}
