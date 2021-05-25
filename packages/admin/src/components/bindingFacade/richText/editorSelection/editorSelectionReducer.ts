import type { EditorSelectionAction } from './EditorSelectionAction'
import { EditorSelectionActionType } from './EditorSelectionActionType'
import { EditorSelectionState, EditorSelectionStateName } from './EditorSelectionState'

export const defaultEditorSelectionState: EditorSelectionState = {
	name: EditorSelectionStateName.Unfocused,
}

// TODO this whole thing needs reworked because the selection object is actually super mutable and that leads to some
// 	fun situations…
export const editorSelectionReducer = (
	previousState: EditorSelectionState,
	action: EditorSelectionAction,
): EditorSelectionState => {
	switch (action.type) {
		case EditorSelectionActionType.Blur: {
			return defaultEditorSelectionState
		}
		case EditorSelectionActionType.SetSelection: {
			if (action.selection.type === 'Caret') {
				return {
					name: EditorSelectionStateName.CollapsedSelection,
					selection: action.selection,
					selectedString: action.selection.toString(),
				}
			} else if (action.selection.type === 'Range') {
				if (previousState.name === EditorSelectionStateName.EmergingPointerSelection) {
					if (!previousState.finishEvent) {
						return {
							...previousState,
							selection: action.selection,
						}
					}
					return {
						name: EditorSelectionStateName.ExpandedPointerSelection,
						startEvent: previousState.startEvent,
						finishEvent: previousState.finishEvent,
						selection: action.selection,
						selectedString: action.selection.toString(),
					}
				}
				return {
					name: EditorSelectionStateName.ExpandedNonPointerSelection,
					selection: action.selection,
					selectedString: action.selection.toString(),
				}
			}
			return previousState
		}
		case EditorSelectionActionType.SetMousePointerSelectionStart: {
			return {
				name: EditorSelectionStateName.EmergingPointerSelection,
				selection: undefined,
				selectedString: '',
				startEvent: action.event,
				finishEvent: undefined,
			}
		}
		case EditorSelectionActionType.SetMousePointerSelectionFinish: {
			if (previousState.name === EditorSelectionStateName.EmergingPointerSelection) {
				const selection = previousState.selection

				if (!selection) {
					return {
						...previousState,
						finishEvent: action.event,
					}
				} else if (selection.type === 'Caret') {
					return {
						name: EditorSelectionStateName.CollapsedSelection,
						selection,
						selectedString: selection.toString(),
					}
				} else if (selection.type === 'Range') {
					if (action.event) {
						return {
							name: EditorSelectionStateName.ExpandedPointerSelection,
							startEvent: previousState.startEvent,
							finishEvent: action.event,
							selection,
							selectedString: selection.toString(),
						}
					}
					return {
						name: EditorSelectionStateName.ExpandedNonPointerSelection,
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
