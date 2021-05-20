import { RefObject, useLayoutEffect, useRef } from 'react'
import { EditorSelectionStateName } from './EditorSelectionState'
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
		selectionState.name === EditorSelectionStateName.ExpandedPointerSelection ||
		selectionState.name === EditorSelectionStateName.ExpandedNonPointerSelection
	const blockToolbarActive =
		selectionState.name === EditorSelectionStateName.CollapsedSelection ||
		selectionState.name === EditorSelectionStateName.EmergingPointerSelection

	useLayoutEffect(() => {
		const container = inlineToolbarRef.current

		if (!container) {
			return
		}

		let top, left
		let domRangeRect: DOMRect | undefined

		if (selectionState.name === EditorSelectionStateName.ExpandedNonPointerSelection) {
			domRangeRect = selectionState.selection.getRangeAt(0).getBoundingClientRect()
		} else if (selectionState.name === EditorSelectionStateName.ExpandedPointerSelection) {
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
