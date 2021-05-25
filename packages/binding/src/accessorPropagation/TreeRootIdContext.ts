import { createContext } from 'react'
import type { TreeRootId } from '../treeParameters'

export const TreeRootIdContext = createContext<undefined | TreeRootId>(undefined)
TreeRootIdContext.displayName = 'TreeRootIdContext'
