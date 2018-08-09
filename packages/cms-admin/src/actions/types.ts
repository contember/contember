import State from '../state'
import { Services } from '../store'

export type Dispatch = (action: any) => any
export type StateGetter = () => State
export type ActionCreator = (dispatch: Dispatch, getState: StateGetter, services: Services) => void | Promise<any>
