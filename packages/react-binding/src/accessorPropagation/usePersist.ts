import type { Persist } from '@contember/binding'
import { useBindingOperations } from './useBindingOperations.js'

export const usePersist = (): Persist => useBindingOperations().persist
