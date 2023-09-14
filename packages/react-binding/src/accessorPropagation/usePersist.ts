import type { Persist } from '@contember/binding'
import { useBindingOperations } from './useBindingOperations'

export const usePersist = (): Persist => useBindingOperations().persist
