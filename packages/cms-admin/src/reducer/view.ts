import { Action, handleActions } from "redux-actions"
import ViewState, { emptyViewState } from "../state/view"
import { Reducer } from "redux"


export const VIEW_REPLACE = 'view_replace'

export default handleActions<ViewState, any>({
  [VIEW_REPLACE]: (state, action: Action<ViewState>) => {
    return action.payload as ViewState
  },
}, emptyViewState) as Reducer
