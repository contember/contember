import { createContext } from 'react'
import type { TreeRootId } from '@contember/binding'

export const TreeRootIdContext = createContext<undefined | TreeRootId>(undefined)
TreeRootIdContext.displayName = 'TreeRootIdContext'
