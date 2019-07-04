import { assertNever } from 'cms-common'
import { Reducer } from 'redux'
import { Action, handleActions } from 'redux-actions'
import {
	DataTreeCreateRequest,
	DataTreeDirtinessDelta,
	DataTreeInitializeRequest,
	DataTreeSetRequestEnd
} from '../actions/dataTrees'
import { MutationRequestResult } from '../binding'
import { DataTreeRequestReadyState, DataTreeRequestType, DataTreesState, emptyDataTreesState } from '../state/dataTrees'
import { ReducerError } from './ReducerError'

export const DATA_TREE_SET_DIRTINESS = 'data_tree_set_dirtiness'
export const DATA_TREE_REQUEST_CREATE = 'data_tree_request_create'
export const DATA_TREE_REQUEST_INITIALIZE = 'data_tree_request_initialize'
export const DATA_TREE_REQUEST_END = 'data_tree_request_end'
export const DATA_TREE_REQUEST_ERROR = 'data_tree_request_error'

export const createEmptyDataTreeState = () => {
	return {
		isDirty: false,
		isMutating: false,
		requests: {
			query: {
				readyState: DataTreeRequestReadyState.Uninitialized
			},
			mutation: {
				readyState: DataTreeRequestReadyState.Uninitialized
			}
		}
	} as const
}

export const dataTreesReducer: Reducer = handleActions<DataTreesState, any>(
	{
		[DATA_TREE_SET_DIRTINESS]: (state: DataTreesState, action: Action<DataTreeDirtinessDelta>): DataTreesState => {
			if (action.payload === undefined) {
				throw new ReducerError('Action payload can not be undefined')
			}
			const treeState = state[action.payload.dataTreeId] || {}
			return { ...state, [action.payload.dataTreeId]: { ...treeState, isDirty: action.payload.isDirty } }
		},
		[DATA_TREE_REQUEST_CREATE]: (state: DataTreesState, action: Action<DataTreeCreateRequest>): DataTreesState => {
			if (action.payload === undefined) {
				throw new ReducerError('Action payload can not be undefined')
			}
			if (action.payload.dataTreeId in state) {
				throw new ReducerError(`Data tree ${action.payload.dataTreeId} already exists`)
			}
			return {
				...state,
				[action.payload.dataTreeId]: createEmptyDataTreeState()
			}
		},
		[DATA_TREE_REQUEST_INITIALIZE]: (
			state: DataTreesState,
			action: Action<DataTreeInitializeRequest>
		): DataTreesState => {
			if (action.payload === undefined) {
				throw new ReducerError('Action payload can not be undefined')
			}
			const treeState = state[action.payload.dataTreeId] || createEmptyDataTreeState()

			return {
				...state,
				[action.payload.dataTreeId]: {
					...treeState,
					isMutating: action.payload.type === DataTreeRequestType.Mutation ? true : treeState.isMutating,
					requests: {
						...treeState.requests,
						[action.payload.type]: {
							readyState: DataTreeRequestReadyState.Pending
						}
					}
				}
			}
		},
		[DATA_TREE_REQUEST_END]: (state: DataTreesState, action: Action<DataTreeSetRequestEnd>): DataTreesState => {
			if (action.payload === undefined) {
				throw new ReducerError('Action payload can not be undefined')
			}
			const treeState = state[action.payload.dataTreeId]

			if (action.payload.type === DataTreeRequestType.Query) {
				return {
					...state,
					[action.payload.dataTreeId]: {
						...treeState,
						requests: {
							mutation: {
								readyState: DataTreeRequestReadyState.Uninitialized
							},
							query: {
								readyState: DataTreeRequestReadyState.Success,
								data: action.payload.data
							}
						}
					}
				}
			} else if (action.payload.type === DataTreeRequestType.Mutation) {
				const mutationRequestResult: MutationRequestResult = action.payload.data
				const aliases = Object.keys(mutationRequestResult)
				const allOk = aliases.every(item => mutationRequestResult[item].ok)

				return {
					...state,
					[action.payload.dataTreeId]: {
						...treeState,
						isDirty: !allOk,
						isMutating: false,
						requests: {
							query: treeState.requests.query,
							mutation: {
								readyState: allOk ? DataTreeRequestReadyState.Success : DataTreeRequestReadyState.Error,
								data: mutationRequestResult
							}
						}
					}
				}
			} else {
				return assertNever(action.payload)
			}
		}
	},
	emptyDataTreesState
)
