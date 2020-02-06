import { HoveringToolbar as UIToolbar, Portal } from '@contember/ui'
import * as React from 'react'
import { EditorSelectionStateName, useEditorSelection } from '../editorSelection'
import { BlockHoveringToolbarContents, BlockHoveringToolbarContentsProps } from './BlockHoveringToolbarContents'
import { InlineHoveringToolbarContents } from './InlineHoveringToolbarContents'

export interface HoveringToolbarProps extends BlockHoveringToolbarContentsProps {}

export const HoveringToolbar = React.memo((props: HoveringToolbarProps) => {
	const selectionState = useEditorSelection()
	const inlineToolbarRef = React.useRef<HTMLDivElement>(null)

	const inlineToolbarActive =
		selectionState.name === EditorSelectionStateName.ExpandedPointerSelection ||
		selectionState.name === EditorSelectionStateName.ExpandedNonPointerSelection
	const blockToolbarActive =
		selectionState.name === EditorSelectionStateName.CollapsedSelection ||
		selectionState.name === EditorSelectionStateName.EmergingPointerSelection

	React.useLayoutEffect(() => {
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
				domRangeRect = document
					.caretRangeFromPoint(selectionState.finishEvent.clientX, selectionState.finishEvent.clientY)
					.getBoundingClientRect()
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

	// TODO use a container so that it doesn't break during resize.
	return (
		<>
			<Portal>
				<UIToolbar isActive={inlineToolbarActive} ref={inlineToolbarRef} scope="contextual">
					<InlineHoveringToolbarContents />
				</UIToolbar>
			</Portal>
			<UIToolbar isActive={blockToolbarActive}>
				<BlockHoveringToolbarContents blockButtons={props.blockButtons} />
			</UIToolbar>
		</>
	)
})
HoveringToolbar.displayName = 'HoveringToolbar'
