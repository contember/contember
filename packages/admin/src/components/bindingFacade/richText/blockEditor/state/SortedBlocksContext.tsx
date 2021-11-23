import { createContext } from 'react'
import { EntityAccessor } from '@contember/binding'

export const SortedBlocksContext = createContext<EntityAccessor[]>([])
