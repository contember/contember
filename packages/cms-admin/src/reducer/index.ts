import Request from './request'
import View from './view'
import State from "../state"
import { combineReducers } from "redux"
import Auth from './auth';

export default combineReducers<State>({
  request: Request,
	view: View,
	auth: Auth
})
