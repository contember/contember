import { useContext } from 'react'
import type { TreeRootId } from '../treeParameters'
import { TreeRootIdContext } from './TreeRootIdContext'

export const useTreeRootId = (): TreeRootId | undefined => useContext(TreeRootIdContext)
