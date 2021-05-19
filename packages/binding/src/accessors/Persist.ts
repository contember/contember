import { SuccessfulPersistResult } from '../accessorTree'
import { PersistErrorOptions } from './PersistErrorOptions'
import { PersistSuccessOptions } from './PersistSuccessOptions'

export interface PersistOptions {
	signal?: AbortSignal
	onPersistSuccess?: (options: PersistSuccessOptions) => void | Promise<void>
	onPersistError?: (options: PersistErrorOptions) => void | Promise<void>
}

export type Persist = (options?: PersistOptions) => Promise<SuccessfulPersistResult>
