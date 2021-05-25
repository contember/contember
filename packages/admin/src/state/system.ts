export type StageDiffState = 'fetching' | 'failed' | 'done'

export interface StageDiff {
	project: string
	headStage: string
	baseStage: string
	state: StageDiffState
}

export interface StageDiffFetching extends StageDiff {
	state: 'fetching'
}

export interface StageDiffFailed extends StageDiff {
	state: 'failed'
	errors: string[]
}

export interface StageDiffDone extends StageDiff {
	state: 'done'
	events: Event[]
}

export type AnyStageDiff = StageDiffFetching | StageDiffDone | StageDiffFailed

export type EventType = 'UPDATE' | 'DELETE' | 'CREATE' | 'RUN_MIGRATION'

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
	diffs: [],
}
