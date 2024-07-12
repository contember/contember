import type { SuccessfulPersistResult } from '../accessorTree'
import type { PersistErrorOptions } from './PersistErrorOptions'
import type { PersistSuccessOptions } from './PersistSuccessOptions'

export interface PersistOptions {
	signal?: AbortSignal
	onPersistSuccess?: (options: PersistSuccessOptions) => void | Promise<void>
	onPersistError?: (options: PersistErrorOptions) => void | Promise<void>
}

export type Persist = (options?: PersistOptions) => Promise<SuccessfulPersistResult>
