import { applyMiddleware, createStore, Middleware, Store, compose, Reducer } from 'redux'

import thunk from 'redux-thunk'
import rootReducer from '../reducer'
import State from '../state'
import LocalStorageManager from '../model/LocalStorageManager'
import GraphqlClient from '../model/GraphqlClient'
import ContentClientFactory from '../model/ContentClientFactory'
import { createAction } from 'redux-actions'
import { SET_TOKEN } from '../reducer/auth'

export interface Services {
	localStorageManager: LocalStorageManager
	tenantClient: GraphqlClient
	contentClientFactory: ContentClientFactory
}

export function createServices(): Services {
	const localStorageManager = new LocalStorageManager()
	const tenantClient = new GraphqlClient('http://localhost:4000/tenant')
	const contentClientFactory = new ContentClientFactory('http://localhost:4000')
	return {
		localStorageManager,
		tenantClient,
		contentClientFactory
	}
}

export function persistState(services: Services) {
	return (next: Function) => (reducer: Reducer, initialState: State): Store<State> => {
		const store: Store<State> = next(reducer, initialState)

		const persistedApiToken = services.localStorageManager.get(LocalStorageManager.Keys.API_TOKEN)
		if (persistedApiToken) {
			store.dispatch(createAction(SET_TOKEN, () => persistedApiToken)())
		}

		store.subscribe(() => {
			const state = store.getState()
			const token = state.auth.token
			if (token) {
				services.localStorageManager.set(LocalStorageManager.Keys.API_TOKEN, token)
			} else {
				services.localStorageManager.unset(LocalStorageManager.Keys.API_TOKEN)
			}
		})

		return store
	}
}

export function configureStore(initialState: State): Store<State, any> {
	const composeEnhancers: typeof compose = (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose
	const services = createServices()
	const middlewares: Middleware[] = [thunk.withExtraArgument(services)]

	const middlewareEnhancer = applyMiddleware(...middlewares)

	return createStore(rootReducer, initialState, composeEnhancers(middlewareEnhancer, persistState(services)))
}
