import { EditorSelectionAction } from './EditorSelectionAction'
import { EditorSelectionActionType } from './EditorSelectionActionType'
import { EditorSelectionState, EditorSelectionStateName } from './EditorSelectionState'

export const defaultEditorSelectionState: EditorSelectionState = {
	name: EditorSelectionStateName.Unfocused,
}

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
				}
			} else if (action.selection.type === 'Range') {
				if (previousState.name === EditorSelectionStateName.EmergingPointerSelection) {
					return {
						...previousState,
						selection: action.selection,
					}
				}
				return {
					name: EditorSelectionStateName.ExpandedNonPointerSelection,
					selection: action.selection,
				}
			}
			return previousState
		}
		case EditorSelectionActionType.StartEmergingPointerSelection: {
			return {
				name: EditorSelectionStateName.EmergingPointerSelection,
				selection: undefined,
				startEvent: action.event,
			}
		}
		case EditorSelectionActionType.FinishEmergingPointerSelection: {
			if (previousState.name === EditorSelectionStateName.EmergingPointerSelection) {
				const selection = previousState.selection

				if (!selection) {
					return previousState
				} else if (selection.type === 'Caret') {
					return {
						name: EditorSelectionStateName.CollapsedSelection,
						selection,
					}
				} else if (selection.type === 'Range') {
					if (action.event) {
						return {
							name: EditorSelectionStateName.ExpandedPointerSelection,
							finishEvent: action.event,
							selection,
						}
					}
					return {
						name: EditorSelectionStateName.ExpandedNonPointerSelection,
						selection,
					}
				}
				return previousState
			}
			return previousState
		}
	}
	return previousState
}
