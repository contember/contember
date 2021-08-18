import { combineReducers } from 'redux'
import type State from '../state'
import Auth from './auth'
import Request from './request'
import Toasts from './toasts'

export default combineReducers<State>({
	basePath: (state, action) => state ?? '', // TODO: drop basePath from state?
	request: Request,
	auth: Auth,
	projectConfig: (state, action) => state ?? null!, // TODO: drop projectConfig from state?
	toasts: Toasts,
})
