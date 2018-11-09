import { combineReducers } from 'redux'
import State from '../state'
import Auth from './auth'
import Content from './content'
import ProjectsConfigs from './projectsConfigs'
import Request from './request'
import View from './view'
import Upload from './upload'

export default combineReducers<State>({
	request: Request,
	view: View,
	auth: Auth,
	content: Content,
	projectsConfigs: ProjectsConfigs,
	upload: Upload
})
