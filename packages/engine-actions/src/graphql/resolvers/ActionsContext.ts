import { DatabaseContext } from '@contember/engine-system-api'
import { ContentSchemaResolver } from '@contember/engine-http'
import { Logger } from '@contember/logger'
import { Authorizator } from '@contember/authorization'

export interface ActionsContext {
	logger: Logger
	db: DatabaseContext
	contentSchemaResolver: ContentSchemaResolver
	requireAccess: (action: Authorizator.Action, message?: string) => Promise<void>
}
