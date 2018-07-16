import State from "../state"

export type Dispatch = (action: any) => any
export type StateGetter = () => State
export type ActionCreator = (dispatch: Dispatch, getState: StateGetter) => void | Promise<any>
