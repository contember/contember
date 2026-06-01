import type { GetEntityByKey } from '@contember/binding'
import { useBindingOperations } from './useBindingOperations.js'

export const useGetEntityByKey = (): GetEntityByKey => useBindingOperations().getEntityByKey
