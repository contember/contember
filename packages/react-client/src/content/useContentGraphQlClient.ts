import type { GraphQlClient } from '@contember/client'
import { formatContentApiRelativeUrl } from '@contember/client'
import { useGraphQlClient } from '../useGraphQlClient'

export const useContentGraphQlClient = (projectSlug: string, stageSlug: string): GraphQlClient =>
	useGraphQlClient(formatContentApiRelativeUrl(projectSlug, stageSlug))
