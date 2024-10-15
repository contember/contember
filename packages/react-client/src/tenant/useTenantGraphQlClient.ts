import { useGraphQlClient } from '../useGraphQlClient'

export const useTenantGraphQlClient = () => useGraphQlClient('/tenant')
