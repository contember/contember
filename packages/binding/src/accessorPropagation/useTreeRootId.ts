import { useContext } from 'react'
import { TreeRootId } from '../treeParameters'
import { TreeRootIdContext } from './TreeRootIdContext'

export const useTreeRootId = (): TreeRootId | undefined => useContext(TreeRootIdContext)
