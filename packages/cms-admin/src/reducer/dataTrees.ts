import { Reducer } from 'redux'
import { Action, handleActions } from 'redux-actions'
import { emptyDataTreesState, DataTreeDirtinessDelta, DataTreesState } from '../state/dataTrees'

export const DATA_TREE_SET_DIRTINESS = 'data_tree_set_dirtiness'

export default handleActions<DataTreesState, any>(
	{
		[DATA_TREE_SET_DIRTINESS]: (state, action: Action<DataTreeDirtinessDelta>): DataTreesState => {
			if (action.payload === undefined) {
				throw new Error('Action payload can not be undefined')
			}
			return { ...state, dirty: { ...state.dirty, [action.payload.dataTreeId]: action.payload.isDirty } }
		}
	},
	emptyDataTreesState
) as Reducer
