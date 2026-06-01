import type { SuccessfulPersistResult } from './PersistResult.js'
import type { PersistErrorOptions } from './PersistErrorOptions.js'
import type { PersistSuccessOptions } from './PersistSuccessOptions.js'

export interface PersistOptions {
	signal?: AbortSignal
	onPersistSuccess?: (options: PersistSuccessOptions) => void | Promise<void>
	onPersistError?: (options: PersistErrorOptions) => void | Promise<void>
}

export type Persist = (options?: PersistOptions) => Promise<SuccessfulPersistResult>
