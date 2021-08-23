import AuthState from './auth'
import { ProjectConfig } from './projectsConfigs'
import RequestState from './request'
import ToastsState from './toasts'

export default interface State {
	basePath: string // TODO: remove from state
	request: RequestState
	auth: AuthState
	projectConfig: ProjectConfig // TODO: remove from state
	toasts: ToastsState
}
