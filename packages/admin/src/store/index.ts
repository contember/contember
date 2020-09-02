import { applyMiddleware, compose, createStore, Middleware, Reducer, Store as ReduxStore } from 'redux'
import { createAction } from 'redux-actions'

import thunk from 'redux-thunk'
import { Dispatch } from '../actions/types'
import { ClientConfig } from '../bootstrap'
import ContentClientFactory from '../model/ContentClientFactory'
import GraphqlClient from '../model/GraphqlClient'
import LocalStorageManager from '../model/LocalStorageManager'
import SystemClientFactory from '../model/SystemClientFactory'
import rootReducer from '../reducer'
import { SET_IDENTITY } from '../reducer/auth'
import State from '../state'

export interface Services {
	localStorageManager: LocalStorageManager
	tenantClient: GraphqlClient
	contentClientFactory: ContentClientFactory
	systemClientFactory: SystemClientFactory
	config: ClientConfig
}

export function createServices(config: ClientConfig): Services {
	const localStorageManager = new LocalStorageManager()
	const tenantClient = new GraphqlClient(config.apiBaseUrl + '/tenant')
	const contentClientFactory = new ContentClientFactory(config.apiBaseUrl)
	const systemClientFactory = new SystemClientFactory(config.apiBaseUrl)
	return {
		localStorageManager,
		tenantClient,
		contentClientFactory,
		systemClientFactory,
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

		const persistedApiIdentity = services.localStorageManager.get(LocalStorageManager.Keys.API_IDENTITY)
		if (persistedApiIdentity) {
			store.dispatch(createAction(SET_IDENTITY, () => JSON.parse(persistedApiIdentity))())
		}

		store.subscribe(() => {
			const state = store.getState()
			const identity = state.auth.identity
			if (identity) {
				services.localStorageManager.set(LocalStorageManager.Keys.API_IDENTITY, JSON.stringify(identity))
			} else {
				services.localStorageManager.unset(LocalStorageManager.Keys.API_IDENTITY)
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
