import { useApiRequest } from '../apiRequest'
import { useTenantGraphQlClient } from './useTenantGraphQlClient'

export const useTenantApiRequest = <SuccessData>() => useApiRequest<SuccessData>(useTenantGraphQlClient())
