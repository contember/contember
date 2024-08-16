import type { AsyncBatchUpdatesOptions } from './AsyncBatchUpdatesOptions'

export interface ScheduleAnotherPersistOptions {
	proposedBackoff?: number
}

export type ScheduleAnotherPersist = (options?: ScheduleAnotherPersistOptions) => void

export interface PersistErrorOptions extends AsyncBatchUpdatesOptions {
}
