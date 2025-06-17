import type { UseApiRequestResult } from '../apiRequest'
import { useApiRequest } from '../apiRequest'
import { useTenantGraphQlClient } from './useTenantGraphQlClient'

export const useTenantApiRequest = <SuccessData>(): UseApiRequestResult<SuccessData> =>
	useApiRequest<SuccessData>(useTenantGraphQlClient())
