import type RequestState from './request'

export default interface ViewState {
	loading: boolean
	route: RequestState | null
}

export const emptyViewState: ViewState = {
	loading: false,
	route: null,
}
