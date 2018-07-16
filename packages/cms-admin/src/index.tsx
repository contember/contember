import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { configureStore } from './store'
import { Provider } from "react-redux"
import { populateRequest } from "./actions/request"
import { emptyState } from "./state"
import Example from './containers/example'

const store = configureStore(emptyState)
store.dispatch(populateRequest(document.location))
window.onpopstate = () => {
  store.dispatch(populateRequest(document.location))
}
const element = <div>
  <Provider store={store}>
    <Example/>
  </Provider>
</div>

window.addEventListener('DOMContentLoaded', function () {
  const root = document.getElementById('root')
  if (!root) {
    return
  }
  ReactDOM.render(element, root)
})
