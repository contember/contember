export type EditorSelectionState =
	| {
			name: 'unfocused'
	  }
	| {
			name: 'emergingPointerSelection'
			selection: Selection | undefined
			selectedString: string
			startEvent: MouseEvent
			finishEvent: MouseEvent | undefined
	  }
	| {
			name: 'expandedPointerSelection'
			selection: Selection
			selectedString: string
			startEvent: MouseEvent
			finishEvent: MouseEvent
	  }
	| {
			name: 'expandedNonPointerSelection'
			selection: Selection
			selectedString: string
	  }
	| {
			name: 'collapsedSelection'
			selection: Selection
			selectedString: string
	  }
