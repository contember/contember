import { Context } from '@contember/engine-content-api'

export type ContentGraphqlContext = Context & {
	identityId: string
	requestDebug: boolean
	project: { slug: string }
}
