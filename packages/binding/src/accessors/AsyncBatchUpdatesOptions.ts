import { GraphQlClient } from '@contember/client'
import { BatchUpdatesOptions } from './BatchUpdatesOptions'

export interface AsyncBatchUpdatesOptions extends BatchUpdatesOptions {
	contentClient: GraphQlClient
	systemClient: GraphQlClient
	tenantClient: GraphQlClient
}
