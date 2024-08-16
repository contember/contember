import type { GetEntityByKey } from '@contember/binding'
import { useBindingOperations } from './useBindingOperations'

export const useGetEntityByKey = (): GetEntityByKey => useBindingOperations().getEntityByKey
