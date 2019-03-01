import AuthState, { emptyAuthState } from './auth'
import ContentState, { emptyContentState } from './content'
import { DataTreesState, emptyDataTreesState } from './dataTrees'
import ProjectsConfigsState, { emptyProjectsConfigsState } from './projectsConfigs'
import RequestState, { emptyRequestState } from './request'
import ToastsState, { emptyToastsState } from './toasts'
import UploadState, { emptyUploadState } from './upload'
import ViewState, { emptyViewState } from './view'
import SystemState, { emptySystemState } from './system'

export default interface State {
	request: RequestState
	view: ViewState
	auth: AuthState
	content: ContentState
	projectsConfigs: ProjectsConfigsState
	upload: UploadState
	toasts: ToastsState
	dataTrees: DataTreesState
	system: SystemState
}

export const emptyState: State = {
	request: emptyRequestState,
	view: emptyViewState,
	auth: emptyAuthState,
	content: emptyContentState,
	projectsConfigs: emptyProjectsConfigsState,
	upload: emptyUploadState,
	toasts: emptyToastsState,
	dataTrees: emptyDataTreesState,
	system: emptySystemState
}
