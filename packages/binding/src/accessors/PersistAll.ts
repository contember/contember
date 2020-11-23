import { SuccessfulPersistResult } from '../accessorTree'

export interface PersistAllOptions {
	signal?: AbortSignal
}

export type PersistAll = (options?: PersistAllOptions) => Promise<SuccessfulPersistResult>
