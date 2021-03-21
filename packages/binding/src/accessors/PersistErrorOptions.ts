import { AsyncBatchUpdatesOptions } from './AsyncBatchUpdatesOptions'

export interface ScheduleAnotherPersistOptions {
	proposedBackoff?: number
}

export type ScheduleAnotherPersist = (options?: ScheduleAnotherPersistOptions) => void

export interface PersistErrorOptions extends AsyncBatchUpdatesOptions {
	attemptNumber: number
	tryAgain: ScheduleAnotherPersist
}
