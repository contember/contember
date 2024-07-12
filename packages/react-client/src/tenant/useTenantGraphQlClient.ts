import { tenantApiRelativeUrl } from '@contember/client'
import { useGraphQlClient } from '../useGraphQlClient'

export const useTenantGraphQlClient = () => useGraphQlClient(tenantApiRelativeUrl)
