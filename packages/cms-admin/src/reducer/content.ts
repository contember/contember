import { Action, handleActions } from 'redux-actions'
import ContentState, { emptyContentState, ContentStatus } from '../state/content'
import { Reducer } from 'redux'

export const CONTENT_SET_DATA = 'content_set_data'
export const CONTENT_SET_LOADING = 'content_set_loading'
export const CONTENT_SET_NONE = 'content_set_none'

interface ContentActionPayload {
	id: string
	data?: any
}

export default handleActions<ContentState, ContentActionPayload>(
	{
		[CONTENT_SET_DATA]: (state, action) => {
			return {
				...state,
				requests: {
					...state.requests,
					[action.payload!.id]: { data: action.payload!.data, state: ContentStatus.LOADED }
				}
			}
		},
		[CONTENT_SET_LOADING]: (state, action) => {
			return {
				...state,
				requests: { ...state.requests, [action.payload!.id]: { data: null, state: ContentStatus.LOADING } }
			}
		},
		[CONTENT_SET_NONE]: (state, action) => {
			return {
				...state,
				requests: { ...state.requests, [action.payload!.id]: { data: null, state: ContentStatus.NONE } }
			}
		}
	},
	emptyContentState
) as Reducer
