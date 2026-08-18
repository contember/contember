import type { SuccessfulPersistResult } from './PersistResult.js'
import type { PersistErrorOptions } from './PersistErrorOptions.js'
import type { PersistSuccessOptions } from './PersistSuccessOptions.js'

export interface PersistOptions {
	signal?: AbortSignal
	onPersistSuccess?: (options: PersistSuccessOptions) => void | Promise<void>
	onPersistError?: (options: PersistErrorOptions) => void | Promise<void>
	/**
	 * Don't emit the data binding `persistError` event for this particular persist. Reporting the failure is
	 * left to the caller, which is what autosave-style flows want: a failing save on every idle timer would
	 * otherwise keep firing the global error handler. Per-entity `persistError` listeners and the
	 * `onPersistError` option still run, and the returned promise still rejects.
	 */
	silentErrors?: boolean
}

export type Persist = (options?: PersistOptions) => Promise<SuccessfulPersistResult>
