import { connect } from "react-redux"
import { pushRequest } from "../actions/request"
import { detailRequest, listRequest } from "../state/request"
import { Dispatch } from "../actions/types"
import State from "../state"
import * as React from 'react'

export default connect<State, { onViewGrid: (name: string) => void, onViewEdit: (name: string, id: string) => void }, {}, State>((state) => {
  return state
}, (dispatch: Dispatch) => {
  return {
    onViewGrid: (name: string) => dispatch(pushRequest(listRequest(name))),
    onViewEdit: (name: string, id: string) => dispatch(pushRequest(detailRequest(name, id))),
  }
})((props) => {
  return <div>
    <h1>Request: {props.request.name} - {props.request.id}</h1>
    <h1>View: {props.view.name} - {props.view.id}</h1>
    <ul>
      <li><a onClick={() => props.onViewGrid("posts")}>Posts</a></li>
      <li><a onClick={() => props.onViewGrid("categories")}>Categories</a></li>
    </ul>
    {props.view.loading && <h2>Loading</h2>}

    {props.view.name && props.view.id === null && <>
      <h1>Listing: {props.view.name}</h1>
      <table>
        <tbody>
        {["1", "2", "3", "4"].map(id => <tr key={id} onClick={() => props.onViewEdit(props.view.name as string, id)}>
          <td>Item {id}</td>
        </tr>)}
        </tbody>
      </table>
    </>}

    {props.view.name && props.view.id !== null && <>
      <h1>Editing: {props.view.name} - {props.view.id}</h1>
      <a onClick={() => props.onViewGrid(props.view.name as string)}>Back</a>
    </>}
  </div>
})
