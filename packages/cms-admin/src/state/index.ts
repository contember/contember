import RequestState, { emptyRequestState } from "./request"
import ViewState, { emptyViewState } from "./view"

export default interface State
{
  request: RequestState
  view: ViewState
}

export const emptyState: State = {
  request: emptyRequestState,
  view: emptyViewState,
}

