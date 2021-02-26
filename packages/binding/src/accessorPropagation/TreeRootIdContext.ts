import * as React from 'react'
import { TreeRootId } from '../treeParameters'

export const TreeRootIdContext = React.createContext<undefined | TreeRootId>(undefined)
TreeRootIdContext.displayName = 'TreeRootIdContext'
