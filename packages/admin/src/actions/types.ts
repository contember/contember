import { Action } from 'redux-actions'
import { ThunkDispatch } from 'redux-thunk'
import State from '../state'
import { Services } from '../store'

export type Dispatch<A extends Action<any> = Action<any>> = ThunkDispatch<State, Services, A>
export type StateGetter = () => State
export type ActionCreator<Payload = undefined> = (
	dispatch: Dispatch,
	getState: StateGetter,
	services: Services,
) => Action<Payload> | Promise<Action<Payload>>
