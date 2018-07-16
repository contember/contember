import RequestState from "../state/request"
import { ActionCreator } from "./types"
import { createAction } from "redux-actions"
import { VIEW_REPLACE } from "../reducer/view"

const handleRequest = (request: RequestState, previous: RequestState): ActionCreator => (dispatch, getState) => {

  //show old view and loading overlay until it is loaded
  dispatch(createAction(VIEW_REPLACE, () => ({...getState().view, loading: true}))())
  //do stuff

  window.setTimeout(() => {
    dispatch(createAction(VIEW_REPLACE, () => ({...request, loading: false}))())
  }, 1000)
}

export default handleRequest
