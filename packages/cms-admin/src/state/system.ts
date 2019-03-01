export enum StageDiffState {
	DIFF_FETCHING,
	DIFF_FAILED,
	DIFF_DONE
}

export interface StageDiff {
	project: string
	headStage: string
	baseStage: string
	state: StageDiffState
}

export interface StageDiffFetching extends StageDiff {
	state: StageDiffState.DIFF_FETCHING
}

export interface StageDiffFailed extends StageDiff {
	state: StageDiffState.DIFF_FAILED
	errors: string[]
}

export interface StageDiffDone extends StageDiff {
	state: StageDiffState.DIFF_DONE
	events: Event[]
}

export type AnyStageDiff = StageDiffFetching | StageDiffDone | StageDiffFailed

export interface Event {
	id: string
	dependencies: string[]
	allowed: boolean
	description: string
}

export default interface SystemState {
	diffs: AnyStageDiff[]
}

export const emptySystemState: SystemState = {
	diffs: []
}
