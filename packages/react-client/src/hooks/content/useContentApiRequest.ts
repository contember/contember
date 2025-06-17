import type { UseApiRequestResult } from '../apiRequest'
import { useApiRequest } from '../apiRequest'
import { useCurrentContentGraphQlClient } from './useCurrentContentGraphQlClient'

export const useContentApiRequest = <SuccessData>(): UseApiRequestResult<SuccessData> =>
	useApiRequest<SuccessData>(useCurrentContentGraphQlClient())
