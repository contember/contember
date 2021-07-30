import type { GetEntityByKey } from '../accessors'
import { useBindingOperations } from './useBindingOperations'

export const useGetEntityByKey = (): GetEntityByKey => useBindingOperations().getEntityByKey
