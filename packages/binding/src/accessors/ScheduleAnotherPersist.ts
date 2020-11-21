export interface ScheduleAnotherPersistOptions {
	proposedBackoff?: number
}

export type ScheduleAnotherPersist = (options?: ScheduleAnotherPersistOptions) => void
