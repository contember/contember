import type { Persist } from '../accessors'
import { useBindingOperations } from './useBindingOperations'

export const usePersist = (): Persist => useBindingOperations().persist
