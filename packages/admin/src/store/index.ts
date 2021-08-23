import { applyMiddleware, createStore, Store as ReduxStore } from 'redux'
import thunk from 'redux-thunk'
import type { Dispatch } from '../actions/types'
import rootReducer from '../reducer'
import type State from '../state'


export interface Store extends ReduxStore<State> {
	dispatch: Dispatch
}

export class ReducerError extends Error {
}

export function configureStore(initialState: State): Store {
	const middlewareEnhancer = applyMiddleware(thunk)
	return createStore(rootReducer, initialState, middlewareEnhancer)
}
