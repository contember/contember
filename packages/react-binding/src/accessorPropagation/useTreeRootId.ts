import { useContext } from 'react'
import type { TreeRootId } from '@contember/binding'
import { TreeRootIdContext } from './TreeRootIdContext'

export const useTreeRootId = (): TreeRootId | undefined => useContext(TreeRootIdContext)
