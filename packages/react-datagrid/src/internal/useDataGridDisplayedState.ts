import { ComponentType, createElement, useEffect, useState } from 'react'
import { TreeRootId, useEnvironment, useExtendTree } from '@contember/react-binding'
import { DataGridRendererProps, DataGridState, DataGridStateMethods } from '../types'

export type UseDataGridDisplayedStateResult = {
	gridState: DataGridState<any> | undefined
	treeRootId: TreeRootId | undefined
}

export const useDataGridDisplayedState = <RendererProps extends {}>(
	stateMethods: DataGridStateMethods,
	desiredState: DataGridState<any>,
	renderer: ComponentType<DataGridRendererProps<any> & RendererProps>,
	rendererProps: RendererProps,
): UseDataGridDisplayedStateResult => {
	const [displayedState, setDisplayedState] = useState<{
		gridState: DataGridState<any> | undefined
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
				createElement(renderer, {
					stateMethods,
					treeRootId: undefined,
					desiredState,
					displayedState: desiredState,
					environment,
					pagingInfo: {
						pagesCount: undefined,
						totalCount: undefined,
					},
					...rendererProps,
				}),
			)
			if (newTreeRootId) {
				setDisplayedState({
					gridState: desiredState,
					treeRootId: newTreeRootId,
				})
			}
		})()
	}, [desiredState, displayedState, environment, extendTree, stateMethods, renderer, rendererProps])

	return displayedState
}
