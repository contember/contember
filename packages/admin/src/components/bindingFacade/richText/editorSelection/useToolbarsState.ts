import { RefObject, useEffect, useLayoutEffect, useRef } from 'react'
import { EditorSelectionState } from './EditorSelectionState'
import { useEditorSelection } from './useEditorSelection'

export interface ToolbarsState {
	inlineToolbarRef: RefObject<HTMLDivElement>
	inlineToolbarActive: boolean
	blockToolbarActive: boolean
}

function updateToolbarStyle(container: HTMLDivElement, selectionState: EditorSelectionState) {
	let top, left, maxWidth
	let domRangeRect: DOMRect | undefined

	if (selectionState.name === 'expandedNonPointerSelection') {
		domRangeRect = selectionState.selection.getRangeAt(0).getBoundingClientRect()
	} else if (selectionState.name === 'expandedPointerSelection') {
		if (document.caretRangeFromPoint) {
			domRangeRect =
				document
					.caretRangeFromPoint(selectionState.finishEvent.clientX, selectionState.finishEvent.clientY)
					?.getBoundingClientRect() || undefined
		} else if (document.caretPositionFromPoint) {
			domRangeRect =
				document
					.caretPositionFromPoint(selectionState.finishEvent.clientX, selectionState.finishEvent.clientY)
					?.getClientRect() || undefined
		}
	}

	if (domRangeRect) {
		top = `${domRangeRect.top + window.pageYOffset - container.offsetHeight}px`
		left = `${
			Math.min(
				Math.max(0, document.documentElement.clientWidth - container.offsetWidth),
				Math.max(0, domRangeRect.left + window.pageXOffset - container.offsetWidth / 2 + domRangeRect.width / 2),
			)
		}px`
		maxWidth = `${document.documentElement.clientWidth}px`
	} else {
		top = '-1000vh'
		left = '-1000vw'
		maxWidth = 'unset'
	}

	container.style.top = top
	container.style.left = left
	container.style.maxWidth = maxWidth
}

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

		updateToolbarStyle(container, selectionState)
	}, [selectionState])

	useEffect(() => {
		const container = inlineToolbarRef.current
		let timeoutId: NodeJS.Timeout

		function resize() {
			if (!container) {
				return
			}

			clearTimeout(timeoutId)

			timeoutId = setTimeout(() => {
				updateToolbarStyle(container, selectionState)
			}, 100)
		}

		window.addEventListener('resize', resize)

		return () => {
			window.removeEventListener('resize', resize)
		}
	}, [selectionState])

	return {
		inlineToolbarRef,
		blockToolbarActive,
		inlineToolbarActive,
	}
}
