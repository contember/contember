import type { Reducer } from 'redux'
import { Action, handleActions } from 'redux-actions'
import SystemState, { AnyStageDiff, emptySystemState } from '../state/system'

export const SYSTEM_ADD_DIFF = 'system_add_diff'

export default handleActions<SystemState, any>(
	{
		[SYSTEM_ADD_DIFF]: (state, action: Action<AnyStageDiff>): SystemState => {
			return {
				...state,
				diffs: [
					...state.diffs.filter(
						it =>
							it.project !== action.payload!.project ||
							it.headStage !== action.payload!.headStage ||
							it.baseStage !== action.payload!.baseStage,
					),
					action.payload!,
				],
			}
		},
	},
	emptySystemState,
) as Reducer
