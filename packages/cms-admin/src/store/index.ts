import { applyMiddleware, createStore, Middleware, Store } from 'redux'

import thunk from 'redux-thunk'
import rootReducer from '../reducer'
import State from "../state"

export function configureStore(initialState: State): Store<State, any>
{
  const create = window.devToolsExtension
    ? window.devToolsExtension()(createStore)
    : createStore
  const middlewares: Middleware[] = [
    thunk,
  ]

  const createStoreWithMiddleware = applyMiddleware(...middlewares)(create)

  return createStoreWithMiddleware(rootReducer, initialState) as Store<State, any>
}
