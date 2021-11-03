import { debounce } from 'debounce'
import { useCallback, useEffect, useReducer, useRef } from 'react'
import { Editor, Range as SlateRange } from 'slate'
import { ReactEditor, useSlateStatic } from 'slate-react'
import { defaultEditorSelectionState, editorSelectionReducer } from './editorSelectionReducer'
import type { EditorSelectionState } from './EditorSelectionState'

export const useEditorSelection = (maxInterval: number = 100): EditorSelectionState => {
	const editor = useSlateStatic()
	const [selectionState, dispatch] = useReducer(editorSelectionReducer, defaultEditorSelectionState)
	const selectionStateRef = useRef<EditorSelectionState>(selectionState)

	selectionStateRef.current = selectionState

	const onDOMSelectionChange = debounce(
		useCallback(() => {
			const domSelection = getSelection()
			const isRelevant =
				domSelection &&
				domSelection.anchorNode &&
				ReactEditor.hasDOMNode(editor, domSelection.anchorNode, { editable: true })

			if (isRelevant) {
				if (
					(selectionStateRef.current.name === 'expandedPointerSelection' ||
						selectionStateRef.current.name === 'expandedNonPointerSelection') &&
					!domSelection!.isCollapsed &&
					selectionStateRef.current.selection
				) {
					const stateSelectionRange = ReactEditor.toSlateRange(editor, selectionStateRef.current.selection, { exactMatch: false, suppressThrow: false })
					const domSelectionRange = ReactEditor.toSlateRange(editor, domSelection!, { exactMatch: false, suppressThrow: false })

					if (
						SlateRange.equals(stateSelectionRange, domSelectionRange) &&
						(!editor.selection || Editor.string(editor, editor.selection) === selectionStateRef.current.selectedString)
					) {
						// We've likely just changed a mark or something. To the DOM, this *is* a selection change but as far as we're
						// concerned they are the same.
						return
					}
				}
				dispatch({
					type: 'setSelection',
					selection: domSelection!,
				})
			} else {
				dispatch({
					type: 'blur',
				})
			}
		}, [editor]),
		maxInterval,
	)
	const onMouseDown = useCallback(
		(e: MouseEvent) => {
			e.target &&
				e.target instanceof Node &&
				ReactEditor.hasDOMNode(editor, e.target) &&
				dispatch({
					type: 'setMousePointerSelectionStart',
					event: e,
				})
		},
		[editor],
	)
	const onMouseUp = useCallback(
		(e: MouseEvent) => {
			const relevantTarget = !!e.target && e.target instanceof Node && ReactEditor.hasDOMNode(editor, e.target)
			dispatch({
				type: 'setMousePointerSelectionFinish',
				event: relevantTarget ? e : undefined,
			})
		},
		[editor],
	)

	useEffect(() => {
		document.addEventListener('selectionchange', onDOMSelectionChange)
		document.addEventListener('mousedown', onMouseDown)
		document.addEventListener('mouseup', onMouseUp)

		return () => {
			document.removeEventListener('selectionchange', onDOMSelectionChange)
			document.removeEventListener('mousedown', onMouseDown)
			document.removeEventListener('mouseup', onMouseUp)
		}
	}, [onDOMSelectionChange, onMouseDown, onMouseUp])

	return selectionState
}
