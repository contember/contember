export type DataTreeId = string

export type DataTreeDirtinessState = boolean

export type DataTreeMutationState = boolean

export interface DataTreeDirtinessDelta {
	dataTreeId: DataTreeId
	isDirty: DataTreeDirtinessState
}

export interface DataTreeMutationStateDelta {
	dataTreeId: DataTreeId
	isMutating: DataTreeMutationState
}

export interface DataTreeState {
	isDirty: DataTreeDirtinessState
	isMutating: DataTreeMutationState
}

export interface DataTreesState {
	[id: string]: DataTreeState
}

export const emptyDataTreesState: DataTreesState = {}
