import { combineReducers } from 'redux'
import type State from '../state'
import Auth from './auth'
import ProjectsConfigs from './projectsConfigs'
import Request from './request'
import Toasts from './toasts'
import View from './view'

export default combineReducers<State>({
	request: Request,
	view: View,
	auth: Auth,
	projectsConfigs: ProjectsConfigs,
	toasts: Toasts,
})
