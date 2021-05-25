export type EditorSelectionAction =
	| {
			type: 'blur'
	  }
	| {
			type: 'setSelection'
			selection: Selection
	  }
	| {
			type: 'setMousePointerSelectionStart'
			event: MouseEvent
	  }
	| {
			type: 'setMousePointerSelectionFinish'
			event: MouseEvent | undefined
	  }
