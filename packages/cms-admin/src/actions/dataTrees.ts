import { createAction } from 'redux-actions'
import { DATA_TREE_SET_DIRTINESS } from '../reducer/dataTrees'
import { DataTreeDirtinessDelta, DataTreeDirtinessState, DataTreeId } from '../state/dataTrees'

export const setDataTreeDirtiness = (dataTreeId: DataTreeId, isDirty: DataTreeDirtinessState) =>
	createAction<DataTreeDirtinessDelta>(DATA_TREE_SET_DIRTINESS, () => {
		return {
			dataTreeId,
			isDirty
		}
	})()
