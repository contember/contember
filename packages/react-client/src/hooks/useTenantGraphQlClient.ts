import { useGraphQlClient } from './useGraphQlClient.js'

export const useTenantGraphQlClient = () => useGraphQlClient('/tenant')
