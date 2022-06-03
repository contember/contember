import { ReactNode, useCallback } from 'react'
import { useAbortController, useIsMounted } from '@contember/react-utils'
import { useBindingOperations } from './useBindingOperations'
import { TreeRootId } from '../treeParameters'
import { ExtendTreeOptions } from '../accessors'
import { DataBindingExtendAborted } from '../core'

export const useExtendTree = () => {
	const abort = useAbortController()
	const { extendTree } = useBindingOperations()
	const isMountedRef = useIsMounted()
	return useCallback(async (newFragment: ReactNode, options?: Omit<ExtendTreeOptions, 'signal'>): Promise<TreeRootId | undefined> => {
		try {
			const newTreeRootId = await extendTree(newFragment,
				{ ...options, signal: abort() },
			)
			if (!isMountedRef.current) {
				return
			}
			return newTreeRootId
		} catch (e) {
			if (e === DataBindingExtendAborted) {
				return
			}
			throw e
		}
	}, [abort, extendTree, isMountedRef])
}
