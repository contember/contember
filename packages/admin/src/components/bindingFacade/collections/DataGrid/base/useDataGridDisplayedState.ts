import { useEffect, useState } from 'react'
import { DataGridState, DataGridStateMethods } from './DataGridState'
import { renderGrid } from '../grid/renderGrid'
import { DataBindingExtendAborted, TreeRootId, useBindingOperations, useEnvironment } from '@contember/binding'
import { useAbortController, useIsMounted } from '@contember/react-utils'

export const useDataGridDisplayedState = (stateMethods: DataGridStateMethods, desiredState: DataGridState): {
	gridState: DataGridState | undefined
	treeRootId: TreeRootId | undefined
} => {
	const [displayedState, setDisplayedState] = useState<{
		gridState: DataGridState | undefined
		treeRootId: TreeRootId | undefined
	}>({
		gridState: undefined,
		treeRootId: undefined,
	})

	const abort = useAbortController()
	const { extendTree } = useBindingOperations()
	const isMountedRef = useIsMounted()
	const environment = useEnvironment()
	useEffect(() => {
		(async () => {
			if (displayedState.gridState === desiredState) {
				return
			}
			try {
				const newTreeRootId = await extendTree(
					renderGrid(stateMethods, undefined, desiredState, desiredState, environment),
					{ signal: abort() },
				)
				if (!isMountedRef.current) {
					return
				}
				setDisplayedState({
					gridState: desiredState,
					treeRootId: newTreeRootId,
				})
			} catch (e) {
				if (e === DataBindingExtendAborted) {
					return
				}
				throw e
			}
		})()
	}, [abort, desiredState, displayedState, environment, extendTree, stateMethods, isMountedRef])

	return displayedState
}
