import type { Action } from 'redux-actions'
import type { ThunkDispatch } from 'redux-thunk'
import type State from '../state'
import type { Services } from '../store'

export type Dispatch<A extends Action<any> = Action<any>> = ThunkDispatch<State, Services, A>
export type StateGetter = () => State
export type ActionCreator<Payload = undefined> = (
	dispatch: Dispatch,
	getState: StateGetter,
	services: Services,
) => Action<Payload> | Promise<Action<Payload>>
