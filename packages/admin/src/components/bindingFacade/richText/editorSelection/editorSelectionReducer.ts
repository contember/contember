import type { EditorSelectionAction } from './EditorSelectionAction'
import type { EditorSelectionState } from './EditorSelectionState'

export const defaultEditorSelectionState: EditorSelectionState = {
	name: 'unfocused',
}

// TODO this whole thing needs reworked because the selection object is actually super mutable and that leads to some
// 	fun situations…
export const editorSelectionReducer = (
	previousState: EditorSelectionState,
	action: EditorSelectionAction,
): EditorSelectionState => {
	switch (action.type) {
		case 'blur': {
			return defaultEditorSelectionState
		}
		case 'setSelection': {
			if (action.selection.type === 'Caret') {
				return {
					name: 'collapsedSelection',
					selection: action.selection,
					selectedString: action.selection.toString(),
				}
			} else if (action.selection.type === 'Range') {
				if (previousState.name === 'emergingPointerSelection') {
					if (!previousState.finishEvent) {
						return {
							...previousState,
							selection: action.selection,
						}
					}
					return {
						name: 'expandedPointerSelection',
						startEvent: previousState.startEvent,
						finishEvent: previousState.finishEvent,
						selection: action.selection,
						selectedString: action.selection.toString(),
					}
				}
				return {
					name: 'expandedNonPointerSelection',
					selection: action.selection,
					selectedString: action.selection.toString(),
				}
			}
			return previousState
		}
		case 'setMousePointerSelectionStart': {
			return {
				name: 'emergingPointerSelection',
				selection: undefined,
				selectedString: '',
				startEvent: action.event,
				finishEvent: undefined,
			}
		}
		case 'setMousePointerSelectionFinish': {
			if (previousState.name === 'emergingPointerSelection') {
				const selection = previousState.selection

				if (!selection) {
					return {
						...previousState,
						finishEvent: action.event,
					}
				} else if (selection.type === 'Caret') {
					return {
						name: 'collapsedSelection',
						selection,
						selectedString: selection.toString(),
					}
				} else if (selection.type === 'Range') {
					if (action.event) {
						return {
							name: 'expandedPointerSelection',
							startEvent: previousState.startEvent,
							finishEvent: action.event,
							selection,
							selectedString: selection.toString(),
						}
					}
					return {
						name: 'expandedNonPointerSelection',
						selection,
						selectedString: selection.toString(),
					}
				}
				return previousState
			}
			return previousState
		}
	}
	return previousState
}
