import type { AsyncBatchUpdatesOptions } from './AsyncBatchUpdatesOptions'

export interface PersistSuccessOptions extends AsyncBatchUpdatesOptions {
	successType: 'justSuccess' | 'nothingToPersist'
}
