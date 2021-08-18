import { applyMiddleware, createStore, Store as ReduxStore } from 'redux'
import thunk from 'redux-thunk'
import type { Dispatch } from '../actions/types'
import type { ClientConfig } from '../bootstrap'
import rootReducer from '../reducer'
import type State from '../state'

export interface Services {
	config: ClientConfig
}

export interface Store extends ReduxStore<State> {
	dispatch: Dispatch
}

export class ReducerError extends Error {
}

export function configureStore(initialState: State, config: ClientConfig): Store {
	const services = { config }
	const middlewareEnhancer = applyMiddleware(thunk.withExtraArgument(services))

	return createStore(rootReducer, initialState, middlewareEnhancer)
}
