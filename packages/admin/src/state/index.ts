import AuthState, { emptyAuthState } from './auth'
import ProjectsConfigsState, { emptyProjectsConfigsState } from './projectsConfigs'
import RequestState, { emptyRequestState } from './request'
import ToastsState, { emptyToastsState } from './toasts'
import ViewState, { emptyViewState } from './view'

export default interface State {
	basePath: string
	request: RequestState
	view: ViewState
	auth: AuthState
	projectsConfigs: ProjectsConfigsState
	toasts: ToastsState
}

export const emptyState: State = {
	basePath: '', // or '/projectName
	request: emptyRequestState,
	view: emptyViewState,
	auth: emptyAuthState,
	projectsConfigs: emptyProjectsConfigsState,
	toasts: emptyToastsState,
}
