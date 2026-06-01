import { useContext } from 'react'
import type { TreeRootId } from '@contember/binding'
import { TreeRootIdContext } from './TreeRootIdContext.js'

export const useTreeRootId = (): TreeRootId | undefined => useContext(TreeRootIdContext)
