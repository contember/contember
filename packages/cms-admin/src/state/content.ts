export enum ContentStatus {
	NONE,
	LOADING,
	LOADED
}

export interface ContentRequestState {
	state: ContentStatus
	data: any
}

export type ContentRequestsState = { [key: string]: ContentRequestState }

export default interface ContentState {
	requests: ContentRequestsState
}

export const emptyContentState: ContentState = {
	requests: {}
}
