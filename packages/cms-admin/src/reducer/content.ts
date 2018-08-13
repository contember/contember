import { Action, handleActions } from 'redux-actions'
import ContentState, { emptyContentState, ContentStatus } from '../state/content'
import { Reducer } from 'redux'

export const CONTENT_SET_DATA = 'content_set_data'
export const CONTENT_SET_LOADING = 'content_set_loading'
export const CONTENT_SET_NONE = 'content_set_none'

export default handleActions<ContentState, any>(
	{
		[CONTENT_SET_DATA]: (state, action: Action<any>) => {
			return { ...emptyContentState, data: action.payload, state: ContentStatus.LOADED }
		},
		[CONTENT_SET_LOADING]: (state, action: Action<any>) => {
			return { ...emptyContentState, data: null, state: ContentStatus.LOADING }
		},
		[CONTENT_SET_LOADING]: (state, action: Action<any>) => {
			return { ...emptyContentState, data: null, state: ContentStatus.NONE }
		}
	},
	emptyContentState
) as Reducer
