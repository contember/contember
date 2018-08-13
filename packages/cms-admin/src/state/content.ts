export enum ContentStatus {
	NONE,
	LOADING,
	LOADED
}

export default interface ContentState {
	data: any
	state: ContentStatus
}

export const emptyContentState: ContentState = {
	data: null,
	state: ContentStatus.NONE
}
