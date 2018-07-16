import Request from './request'
import View from './view'
import State from "../state"
import { combineReducers } from "redux"

export default combineReducers<State>({
  request: Request,
  view: View,
})
