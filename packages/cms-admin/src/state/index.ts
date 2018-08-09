import RequestState, { emptyRequestState } from "./request"
import ViewState, { emptyViewState } from "./view"
import AuthState, { emptyAuthState } from "./auth"

export default interface State
{
  request: RequestState
	view: ViewState
	auth: AuthState
}

export const emptyState: State = {
  request: emptyRequestState,
	view: emptyViewState,
	auth: emptyAuthState
}

