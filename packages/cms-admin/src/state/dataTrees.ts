export type DataTreeId = string

export type DataTreeDirtinessState = boolean

export interface DataTreeDirtinessDelta {
	dataTreeId: DataTreeId
	isDirty: DataTreeDirtinessState
}

export interface DataTreeState {
	dirty: DataTreeDirtinessState
}

export interface DataTreesState {
	[id: string]: DataTreeState
}

export const emptyDataTreesState: DataTreesState = {}
