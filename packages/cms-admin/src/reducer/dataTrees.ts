import { Reducer } from 'redux'
import { Action, handleActions } from 'redux-actions'
import {
	emptyDataTreesState,
	DataTreeDirtinessDelta,
	DataTreesState,
	DataTreeMutationStateDelta
} from '../state/dataTrees'

export const DATA_TREE_SET_DIRTINESS = 'data_tree_set_dirtiness'
export const DATA_TREE_SET_MUTATION_STATE = 'data_tree_set_mutation_state'

export default handleActions<DataTreesState, any>(
	{
		[DATA_TREE_SET_DIRTINESS]: (state: DataTreesState, action: Action<DataTreeDirtinessDelta>): DataTreesState => {
			if (action.payload === undefined) {
				throw new Error('Action payload can not be undefined')
			}
			const treeState = state[action.payload.dataTreeId] || {}
			return { ...state, [action.payload.dataTreeId]: { ...treeState, isDirty: action.payload.isDirty } }
		},
		[DATA_TREE_SET_MUTATION_STATE]: (state, action: Action<DataTreeMutationStateDelta>): DataTreesState => {
			if (action.payload === undefined) {
				throw new Error('Action payload can not be undefined')
			}
			const treeState = state[action.payload.dataTreeId] || {}
			return { ...state, [action.payload.dataTreeId]: { ...treeState, isMutating: action.payload.isMutating } }
		}
	},
	emptyDataTreesState
) as Reducer
