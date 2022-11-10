import { DatabaseContext } from '@contember/engine-system-api'
import { ContentSchemaResolver } from '@contember/engine-http'
import { Logger } from '@contember/logger'

export interface ActionsContext {
	logger: Logger
	db: DatabaseContext
	contentSchemaResolver: ContentSchemaResolver
}
