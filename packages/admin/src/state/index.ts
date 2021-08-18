import AuthState from './auth'
import { ProjectConfig } from './projectsConfigs'
import RequestState from './request'
import ToastsState from './toasts'

export default interface State {
	basePath: string
	request: RequestState
	auth: AuthState
	projectConfig: ProjectConfig
	toasts: ToastsState
}
