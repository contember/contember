import { createContext } from 'react'
import { TreeRootId } from '../treeParameters'

export const TreeRootIdContext = createContext<undefined | TreeRootId>(undefined)
TreeRootIdContext.displayName = 'TreeRootIdContext'
