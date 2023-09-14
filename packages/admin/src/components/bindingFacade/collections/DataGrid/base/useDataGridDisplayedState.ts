import { ReactNode, useEffect, useState } from 'react'
import { DataGridState, DataGridStateMethods } from './DataGridState'
import { renderGrid } from '../grid/renderGrid'
import { TreeRootId, useEnvironment, useExtendTree } from '@contember/react-binding'

export const useDataGridDisplayedState = (stateMethods: DataGridStateMethods, desiredState: DataGridState, tile?: ReactNode): {
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

	const environment = useEnvironment()
	const extendTree = useExtendTree()
	useEffect(() => {
		(async () => {
			if (displayedState.gridState === desiredState) {
				return
			}
			const newTreeRootId = await extendTree(
				renderGrid(stateMethods, undefined, desiredState, desiredState, environment, {
					tile,
				}),
			)
			if (newTreeRootId) {
				setDisplayedState({
					gridState: desiredState,
					treeRootId: newTreeRootId,
				})
			}
		})()
	}, [desiredState, displayedState, environment, extendTree, stateMethods, tile])

	return displayedState
}
