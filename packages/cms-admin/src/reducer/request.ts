import { Action, handleActions } from "redux-actions"
import RequestState, { emptyRequestState } from "../state/request"
import { Reducer } from "redux"


export const REQUEST_REPLACE = 'request_replace'

export default handleActions<RequestState, any>({
  [REQUEST_REPLACE]: (state, action: Action<RequestState>) => {
    return action.payload || emptyRequestState
  },
}, emptyRequestState) as Reducer
