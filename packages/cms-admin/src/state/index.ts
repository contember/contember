import RequestState, { emptyRequestState } from './request'
import ViewState, { emptyViewState } from './view'
import AuthState, { emptyAuthState } from './auth'
import ContentState, { emptyContentState } from './content'

export default interface State {
	request: RequestState
	view: ViewState
	auth: AuthState
	content: ContentState
}

export const emptyState: State = {
	request: emptyRequestState,
	view: emptyViewState,
	auth: emptyAuthState,
	content: emptyContentState
}
