import { Context } from '@contember/engine-content-api'
import { RequestMemoryBudget } from '@contember/database'

export type ContentGraphqlContext = Context & {
	identityId: string
	requestDebug: boolean
	project: { slug: string }
	memoryBudget?: RequestMemoryBudget
}
