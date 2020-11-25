import { SuccessfulPersistResult } from '../accessorTree'

export interface PersistOptions {
	signal?: AbortSignal
}

export type Persist = (options?: PersistOptions) => Promise<SuccessfulPersistResult>
