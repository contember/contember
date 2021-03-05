import { debounce } from 'debounce'
import { useReducer, useRef, useCallback, useEffect } from 'react'
import { Editor, Range as SlateRange } from 'slate'
import { ReactEditor, useEditor } from 'slate-react'
import { EditorSelectionActionType } from './EditorSelectionActionType'
import { defaultEditorSelectionState, editorSelectionReducer } from './editorSelectionReducer'
import { EditorSelectionState, EditorSelectionStateName } from './EditorSelectionState'

export const useEditorSelection = (maxInterval: number = 100): EditorSelectionState => {
	const editor = useEditor()
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
					(selectionStateRef.current.name === EditorSelectionStateName.ExpandedPointerSelection ||
						selectionStateRef.current.name === EditorSelectionStateName.ExpandedNonPointerSelection) &&
					!domSelection!.isCollapsed &&
					selectionStateRef.current.selection
				) {
					const stateSelectionRange = ReactEditor.toSlateRange(editor, selectionStateRef.current.selection)
					const domSelectionRange = ReactEditor.toSlateRange(editor, domSelection!)

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
					type: EditorSelectionActionType.SetSelection,
					selection: domSelection!,
				})
			} else {
				dispatch({
					type: EditorSelectionActionType.Blur,
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
					type: EditorSelectionActionType.SetMousePointerSelectionStart,
					event: e,
				})
		},
		[editor],
	)
	const onMouseUp = useCallback(
		(e: MouseEvent) => {
			const relevantTarget = !!e.target && e.target instanceof Node && ReactEditor.hasDOMNode(editor, e.target)
			dispatch({
				type: EditorSelectionActionType.SetMousePointerSelectionFinish,
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
