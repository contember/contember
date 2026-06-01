import type { AsyncBatchUpdatesOptions } from './AsyncBatchUpdatesOptions.js'

export interface PersistSuccessOptions extends AsyncBatchUpdatesOptions {
	successType: 'justSuccess' | 'nothingToPersist'
}
