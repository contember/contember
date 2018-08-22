import Request from './request'
import View from './view'
import State from '../state'
import { combineReducers } from 'redux'
import Auth from './auth'
import Content from './content'
import ProjectsConfigs from './projectsConfigs'

export default combineReducers<State>({
	request: Request,
	view: View,
	auth: Auth,
	content: Content,
	projectsConfigs: ProjectsConfigs
})
