import { Component, useEnvironment } from '@contember/react-binding'
import { ComponentType } from 'react'
import { useDataGridDisplayedState } from '../internal/useDataGridDisplayedState'
import { DataGridRendererProps, DataGridState, DataGridStateMethods } from '../types'
import { usePagingInfo } from '../internal/usePagingInfo'

export type ControlledDataGridProps<P extends {}> =
	& {
		state: DataGridState<any>
		stateMethods: DataGridStateMethods
	}
	& P

export const createControlledDataGrid = <P extends {}>(Renderer: ComponentType<P & DataGridRendererProps<any>>) => Component<ControlledDataGridProps<Omit<P, keyof DataGridRendererProps<any>>>>(({ state, stateMethods, ...props }) => {
	const { gridState, treeRootId } = useDataGridDisplayedState<P>(stateMethods, state, Renderer, props as any)
	const environment = useEnvironment()
	const pagingInfo = usePagingInfo({
		entityName: state.entities.entityName,
		filter: state.filter,
		itemsPerPage: state.paging.itemsPerPage,
	})
	const rendererProps: DataGridRendererProps<any> = {
		environment,
		stateMethods,
		pagingInfo,
		desiredState: state,
		displayedState: gridState,
		treeRootId,
	}

	return <Renderer {...rendererProps} {...(props as unknown as P)} />
}, ({ state, stateMethods, ...props }, environment) => {
	const rendererProps: DataGridRendererProps<any> = {
		environment,
		stateMethods,
		pagingInfo: {
			pagesCount: undefined,
			totalCount: undefined,
		},
		desiredState: state,
		displayedState: state,
		treeRootId: undefined,
	}

	return <Renderer {...rendererProps} {...(props as unknown as P)} />
})
