import type { Action } from 'redux-actions'
import type { ThunkDispatch } from 'redux-thunk'
import type State from '../state'

export type Dispatch<A extends Action<any> = Action<any>> = ThunkDispatch<State, {}, A>
export type StateGetter = () => State
export type ActionCreator<Payload = undefined> = (
	dispatch: Dispatch,
	getState: StateGetter,
) => Action<Payload> | Promise<Action<Payload>>
