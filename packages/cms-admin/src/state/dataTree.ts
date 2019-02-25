export type DataTreeId = string

export type DataTreeDirtinessState = boolean

export interface DataTreeDirtinessDelta {
	dataTreeId: DataTreeId
	isDirty: DataTreeDirtinessState
}

export interface DataTreeState {
	[id: string]: {
		dirty: DataTreeDirtinessState
	}
}

export const emptyDataTreeState: DataTreeState = {}
