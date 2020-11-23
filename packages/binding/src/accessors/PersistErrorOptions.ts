import { BindingOperations } from './BindingOperations'

export interface ScheduleAnotherPersistOptions {
	proposedBackoff?: number
}

export type ScheduleAnotherPersist = (options?: ScheduleAnotherPersistOptions) => void

export interface PersistErrorOptions extends Omit<BindingOperations, 'persistAll'> {
	attemptNumber: number
	tryAgain: ScheduleAnotherPersist
}
