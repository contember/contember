import * as React from 'react'

export enum EditorSelectionStateName {
	Unfocused = 'unfocused',
	CollapsedSelection = 'collapsedSelection',

	// With an anchor, but not a focus
	EmergingPointerSelection = 'emergingPointerSelection',

	ExpandedPointerSelection = 'expandedPointerSelection',
	ExpandedNonPointerSelection = 'expandedNonPointerSelection',
}

export type EditorSelectionState =
	| {
			name: EditorSelectionStateName.Unfocused
	  }
	| {
			name: EditorSelectionStateName.EmergingPointerSelection
			selection: Selection | undefined
			selectedString: string
			startEvent: MouseEvent
			finishEvent: MouseEvent | undefined
	  }
	| {
			name: EditorSelectionStateName.ExpandedPointerSelection
			selection: Selection
			selectedString: string
			startEvent: MouseEvent
			finishEvent: MouseEvent
	  }
	| {
			name: EditorSelectionStateName.ExpandedNonPointerSelection
			selection: Selection
			selectedString: string
	  }
	| {
			name: EditorSelectionStateName.CollapsedSelection
			selection: Selection
			selectedString: string
	  }
