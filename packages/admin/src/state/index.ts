import AuthState, { emptyAuthState } from './auth'
import ProjectsConfigsState, { emptyProjectsConfigsState } from './projectsConfigs'
import RequestState, { emptyRequestState } from './request'
import SystemState, { emptySystemState } from './system'
import ToastsState, { emptyToastsState } from './toasts'
import UploadState, { emptyUploadState } from './upload'
import ViewState, { emptyViewState } from './view'

export default interface State {
	request: RequestState
	view: ViewState
	auth: AuthState
	projectsConfigs: ProjectsConfigsState
	upload: UploadState
	toasts: ToastsState
	system: SystemState
}

export const emptyState: State = {
	request: emptyRequestState,
	view: emptyViewState,
	auth: emptyAuthState,
	projectsConfigs: emptyProjectsConfigsState,
	upload: emptyUploadState,
	toasts: emptyToastsState,
	system: emptySystemState,
}
