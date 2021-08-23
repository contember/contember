import { combineReducers } from 'redux'
import type State from '../state'
import Request from './request'

export default combineReducers<State>({
	basePath: (state, action) => state ?? '', // TODO: drop basePath from state?
	request: Request,
	projectConfig: (state, action) => state ?? null!, // TODO: drop projectConfig from state?
})
