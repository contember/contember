import { createAction } from 'redux-actions'
import { DATA_TREE_SET_DIRTINESS, DATA_TREE_SET_MUTATION_STATE } from '../reducer/dataTrees'
import {
	DataTreeDirtinessDelta,
	DataTreeDirtinessState,
	DataTreeId,
	DataTreeMutationState,
	DataTreeMutationStateDelta
} from '../state/dataTrees'

export const setDataTreeDirtiness = (dataTreeId: DataTreeId, isDirty: DataTreeDirtinessState) =>
	createAction<DataTreeDirtinessDelta>(DATA_TREE_SET_DIRTINESS, () => {
		return {
			dataTreeId,
			isDirty
		}
	})()

export const setDataTreeMutationState = (dataTreeId: DataTreeId, isMutating: DataTreeMutationState) =>
	createAction<DataTreeMutationStateDelta>(DATA_TREE_SET_MUTATION_STATE, () => {
		return {
			dataTreeId,
			isMutating
		}
	})()
