import AuthState, { emptyAuthState } from './auth'
import ProjectsConfigsState, { emptyProjectsConfigsState } from './projectsConfigs'
import RequestState, { emptyRequestState } from './request'
import SystemState, { emptySystemState } from './system'
import ToastsState, { emptyToastsState } from './toasts'
import ViewState, { emptyViewState } from './view'

export default interface State {
	request: RequestState
	view: ViewState
	auth: AuthState
	projectsConfigs: ProjectsConfigsState
	toasts: ToastsState
	system: SystemState
}

export const emptyState: State = {
	request: emptyRequestState,
	view: emptyViewState,
	auth: emptyAuthState,
	projectsConfigs: emptyProjectsConfigsState,
	toasts: emptyToastsState,
	system: emptySystemState,
}
