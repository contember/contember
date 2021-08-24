import { combineReducers } from 'redux'
import type State from '../state'
import Request from './request'

export default combineReducers<State>({
	request: Request,
})
