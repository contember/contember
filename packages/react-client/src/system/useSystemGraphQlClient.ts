import { formatSystemApiRelativeUrl } from '@contember/client'
import { useGraphQlClient } from '../useGraphQlClient'

export const useSystemGraphQlClient = (projectSlug: string) => useGraphQlClient(formatSystemApiRelativeUrl(projectSlug))
