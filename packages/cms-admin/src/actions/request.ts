import { createAction } from "redux-actions"
import { REQUEST_REPLACE } from "../reducer/request"
import { ActionCreator } from "./types"
import { buildParams, parseParams } from "../utils/url"
import { default as RequestState, emptyRequestState, RequestChange } from "../state/request"
import handleRequest from "./requestHandler";


export const pushRequest = (requestChange: RequestChange): ActionCreator => (dispatch, getState) => {
  const previousRequest = getState().request
  const request: RequestState = {...emptyRequestState, ...requestChange(previousRequest)}
  dispatch(createAction(REQUEST_REPLACE, () => request)())

  window.history.pushState({}, document.title, '/' + buildParams({name: request.name, id: request.id}))
  dispatch(handleRequest(request, previousRequest))
}

export const populateRequest = (location: Location): ActionCreator => (dispatch, getState) => {
  const params = parseParams(location.search)

  const request: RequestState = {
    id: params.id || null,
    name: params.name || null,
  }

  const previousRequest = getState().request
  dispatch(createAction(REQUEST_REPLACE, () => request)())
  dispatch(handleRequest(request, previousRequest))
}


