import AuthState, { emptyAuthState } from './auth'
import ContentState, { emptyContentState } from './content'
import { DataTreeState, emptyDataTreeState } from './dataTree'
import ProjectsConfigsState, { emptyProjectsConfigsState } from './projectsConfigs'
import RequestState, { emptyRequestState } from './request'
import ToastsState, { emptyToastsState } from './toasts'
import UploadState, { emptyUploadState } from './upload'
import ViewState, { emptyViewState } from './view'

export default interface State {
	request: RequestState
	view: ViewState
	auth: AuthState
	content: ContentState
	projectsConfigs: ProjectsConfigsState
	upload: UploadState
	toasts: ToastsState
	dataTree: DataTreeState
}

export const emptyState: State = {
	request: emptyRequestState,
	view: emptyViewState,
	auth: emptyAuthState,
	content: emptyContentState,
	projectsConfigs: emptyProjectsConfigsState,
	upload: emptyUploadState,
	toasts: emptyToastsState,
	dataTree: emptyDataTreeState
}
