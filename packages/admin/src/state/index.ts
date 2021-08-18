import AuthState from './auth'
import { ProjectConfig } from './projectsConfigs'
import RequestState from './request'
import ToastsState from './toasts'
import ViewState from './view'

export default interface State {
	basePath: string
	request: RequestState
	view: ViewState
	auth: AuthState
	projectConfig: ProjectConfig
	toasts: ToastsState
}
