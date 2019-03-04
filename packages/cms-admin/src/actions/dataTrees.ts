import { createAction } from 'redux-actions'
import { DATA_TREE_SET_DIRTINESS, DATA_TREE_SET_MUTATION_STATE } from '../reducer/dataTrees'
import { DataTreeDirtinessState, DataTreeId, DataTreeMutationState } from '../state/dataTrees'

export interface DataTreeDirtinessDelta {
	dataTreeId: DataTreeId
	isDirty: DataTreeDirtinessState
}

export const setDataTreeDirtiness = (dataTreeId: DataTreeId, isDirty: DataTreeDirtinessState) =>
	createAction<DataTreeDirtinessDelta>(DATA_TREE_SET_DIRTINESS, () => {
		return {
			dataTreeId,
			isDirty
		}
	})()

export interface DataTreeMutationStateDelta {
	dataTreeId: DataTreeId
	isMutating: DataTreeMutationState
}

export const setDataTreeMutationState = (dataTreeId: DataTreeId, isMutating: DataTreeMutationState) =>
	createAction<DataTreeMutationStateDelta>(DATA_TREE_SET_MUTATION_STATE, () => {
		return {
			dataTreeId,
			isMutating
		}
	})()
