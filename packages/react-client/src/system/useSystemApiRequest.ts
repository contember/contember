import type { UseApiRequestResult } from '../apiRequest'
import { useApiRequest } from '../apiRequest'
import { useCurrentSystemGraphQlClient } from './useCurrentSystemGraphQlClient'

export const useSystemApiRequest = <SuccessData>(): UseApiRequestResult<SuccessData> =>
	useApiRequest<SuccessData>(useCurrentSystemGraphQlClient())
