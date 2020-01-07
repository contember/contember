import { useApiRequest } from './apiRequest'
import { useCurrentContentGraphQlClient } from './useCurrentContentGraphQlClient'

export const useContentApiRequest = <SuccessData>() => useApiRequest<SuccessData>(useCurrentContentGraphQlClient())
