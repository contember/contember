import { formatContentApiRelativeUrl } from '@contember/client'
import { useGraphQlClient } from '../useGraphQlClient'

export const useContentGraphQlClient = (projectSlug: string, stageSlug: string) =>
	useGraphQlClient(formatContentApiRelativeUrl(projectSlug, stageSlug))
