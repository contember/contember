import type { EditorSelectionActionType } from './EditorSelectionActionType'

export type EditorSelectionAction =
	| {
			type: EditorSelectionActionType.Blur
	  }
	| {
			type: EditorSelectionActionType.SetSelection
			selection: Selection
	  }
	| {
			type: EditorSelectionActionType.SetMousePointerSelectionStart
			event: MouseEvent
	  }
	| {
			type: EditorSelectionActionType.SetMousePointerSelectionFinish
			event: MouseEvent | undefined
	  }
