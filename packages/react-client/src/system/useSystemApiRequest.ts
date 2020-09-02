import { useApiRequest } from '../apiRequest'
import { useCurrentSystemGraphQlClient } from './useCurrentSystemGraphQlClient'

export const useSystemApiRequest = <SuccessData>() => useApiRequest<SuccessData>(useCurrentSystemGraphQlClient())
