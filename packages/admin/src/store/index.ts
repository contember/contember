import { applyMiddleware, compose, createStore, Middleware, Reducer, Store as ReduxStore } from 'redux'
import { createAction } from 'redux-actions'

import thunk from 'redux-thunk'
import type { Dispatch } from '../actions/types'
import type { ClientConfig } from '../bootstrap'
import { LocalStorageManager } from '../model/LocalStorageManager'
import rootReducer from '../reducer'
import { SET_IDENTITY } from '../reducer/auth'
import type State from '../state'

export interface Services {
	localStorageManager: LocalStorageManager
	config: ClientConfig
}

export function createServices(config: ClientConfig): Services {
	const localStorageManager = new LocalStorageManager()
	return {
		localStorageManager,
		config,
	}
}

export interface Store extends ReduxStore<State> {
	dispatch: Dispatch
}

export class ReducerError extends Error {}

export function persistState(services: Services) {
	return (next: Function) => (reducer: Reducer, initialState: State): Store => {
		const store: Store = next(reducer, initialState)

		const persistedApiIdentity = services.localStorageManager.get('api_identity')
		if (persistedApiIdentity) {
			store.dispatch(createAction(SET_IDENTITY, () => JSON.parse(persistedApiIdentity))())
		}

		store.subscribe(() => {
			const state = store.getState()
			const identity = state.auth.identity
			if (identity) {
				services.localStorageManager.set('api_identity', JSON.stringify(identity))
			} else {
				services.localStorageManager.unset('api_identity')
			}
		})

		return store
	}
}

export function configureStore(initialState: State, config: ClientConfig): Store {
	const composeEnhancers: typeof compose = (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose
	const services = createServices(config)
	const middlewares: Middleware[] = [thunk.withExtraArgument(services)]

	const middlewareEnhancer = applyMiddleware(...middlewares)

	// "as any" is a workaround for typescript exceeding max call stack size (tsc's bug)
	return (createStore as any)(rootReducer, initialState, composeEnhancers(middlewareEnhancer, persistState(services)))
}
