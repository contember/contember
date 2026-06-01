import type { GraphQlClient } from '@contember/client'
import type { BatchUpdatesOptions } from './BatchUpdatesOptions.js'

export interface AsyncBatchUpdatesOptions extends BatchUpdatesOptions {
	contentClient: GraphQlClient
	systemClient: GraphQlClient
	tenantClient: GraphQlClient
}
