export enum StageDiffState {
	DIFF_FETCHING = 'fetching',
	DIFF_FAILED = 'failed',
	DIFF_DONE = 'done'
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

export enum EventType {
	UPDATE = 'UPDATE',
	DELETE = 'DELETE',
	CREATE = 'CREATE',
	RUN_MIGRATION = 'RUN_MIGRATION'
}

export interface Event {
	id: string
	dependencies: string[]
	allowed: boolean
	description: string
	type: EventType
}

export default interface SystemState {
	diffs: AnyStageDiff[]
}

export const emptySystemState: SystemState = {
	diffs: []
}
