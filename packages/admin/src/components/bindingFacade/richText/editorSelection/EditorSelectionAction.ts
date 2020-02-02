import { EditorSelectionActionType } from './EditorSelectionActionType'

export type EditorSelectionAction =
	| {
			type: EditorSelectionActionType.Blur
	  }
	| {
			type: EditorSelectionActionType.SetSelection
			selection: Selection
	  }
	| {
			type: EditorSelectionActionType.StartEmergingPointerSelection
			event: MouseEvent
	  }
	| {
			type: EditorSelectionActionType.FinishEmergingPointerSelection
			event: MouseEvent | undefined
	  }
