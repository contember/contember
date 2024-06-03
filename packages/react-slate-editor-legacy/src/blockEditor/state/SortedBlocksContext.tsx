import { createContext } from 'react'
import { EntityAccessor } from '@contember/react-binding'

export const SortedBlocksContext = createContext<EntityAccessor[]>([])
