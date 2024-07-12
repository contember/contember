import type { TreeFilter } from '@contember/client'
import { useBindingOperations } from './useBindingOperations'

export const useGetTreeFilters = (): (() => TreeFilter[]) => useBindingOperations().getTreeFilters
