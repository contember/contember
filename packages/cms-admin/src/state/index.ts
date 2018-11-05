import AuthState, { emptyAuthState } from './auth'
import ContentState, { emptyContentState } from './content'
import ProjectsConfigsState, { emptyProjectsConfigsState } from './projectsConfigs'
import RequestState, { emptyRequestState } from './request'
import ViewState, { emptyViewState } from './view'

export default interface State {
	request: RequestState
	view: ViewState
	auth: AuthState
	content: ContentState
	projectsConfigs: ProjectsConfigsState
}

export const emptyState: State = {
	request: emptyRequestState,
	view: emptyViewState,
	auth: emptyAuthState,
	content: emptyContentState,
	projectsConfigs: emptyProjectsConfigsState
}
