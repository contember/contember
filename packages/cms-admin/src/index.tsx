import * as React from 'react'
import { configureStore } from './store'
import { Provider } from 'react-redux'
import { populateRequest } from './actions/request'
import { emptyState } from './state'
import Router from './containers/router'

const store = configureStore(emptyState)
store.dispatch(populateRequest(document.location))
window.onpopstate = (e) => {
	e.preventDefault()
	store.dispatch(populateRequest(document.location))
}

export const root = (
	<div>
		<Provider store={store}>
			<Router />
		</Provider>
	</div>
)
