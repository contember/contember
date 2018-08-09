import { applyMiddleware, createStore, Middleware, Store } from 'redux'

import thunk from 'redux-thunk'
import rootReducer from '../reducer'
import State from '../state'
import LocalStorageManager from '../model/LocalStorageManager'
import GraphqlClient from '../model/GraphqlClient'

export interface Services {
	localStorageManager: LocalStorageManager
	tenantClient: GraphqlClient
}

export function createServices(): Services {
	const localStorageManager = new LocalStorageManager()
	const tenantClient = new GraphqlClient('http://localhost:4000/tenant')
	return {
		localStorageManager,
		tenantClient
	}
}

export function configureStore(initialState: State): Store<State, any> {
	const create = window.devToolsExtension ? window.devToolsExtension()(createStore) : createStore
	const middlewares: Middleware[] = [thunk.withExtraArgument(createServices())]

	const createStoreWithMiddleware = applyMiddleware(...middlewares)(create)

	return createStoreWithMiddleware(rootReducer, initialState) as Store<State, any>
}
