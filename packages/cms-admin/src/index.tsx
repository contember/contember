import * as React from 'react'
import { configureStore } from './store'
import { Provider } from 'react-redux'
import { populateRequest } from './actions/request'
import { emptyState } from './state'
import Example from './containers/example'
import Login from './components/Login'
import SignUp from './components/SignUp';

const store = configureStore(emptyState)
store.dispatch(populateRequest(document.location))
window.onpopstate = () => {
	store.dispatch(populateRequest(document.location))
}

export const root = (
	<div>
		<Provider store={store}>
			<>
				<Example />
				<Login />
				<SignUp />
			</>
		</Provider>
	</div>
)
