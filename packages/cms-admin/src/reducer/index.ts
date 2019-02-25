import { combineReducers } from 'redux'
import State from '../state'
import Auth from './auth'
import Content from './content'
import DataTree from './dataTree'
import ProjectsConfigs from './projectsConfigs'
import Request from './request'
import Toasts from './toasts'
import Upload from './upload'
import View from './view'

export default combineReducers<State>({
	request: Request,
	view: View,
	auth: Auth,
	content: Content,
	projectsConfigs: ProjectsConfigs,
	upload: Upload,
	toasts: Toasts,
	dataTree: DataTree
})
