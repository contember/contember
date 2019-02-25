import { Reducer } from 'redux'
import { Action, handleActions } from 'redux-actions'
import { emptyDataTreeState, DataTreeDirtinessDelta, DataTreeState } from '../state/dataTree'

export const DATA_TREE_SET_DIRTINESS = 'data_tree_set_dirtiness'

export default handleActions<DataTreeState, any>(
	{
		[DATA_TREE_SET_DIRTINESS]: (state, action: Action<DataTreeDirtinessDelta>): DataTreeState => {
			if (action.payload === undefined) {
				throw new Error('Action payload can not be undefined')
			}
			return { ...state, dirty: { ...state.dirty, [action.payload.dataTreeId]: action.payload.isDirty } }
		}
	},
	emptyDataTreeState
) as Reducer
