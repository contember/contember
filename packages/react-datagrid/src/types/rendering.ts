import { DataGridState, DataGridStateMethods } from './gridState'
import { EntityListAccessor, Environment, TreeRootId } from '@contember/react-binding'
import { GridPagingInfo } from './paging'
import { ReactNode } from 'react'

export interface DataGridRendererProps<ColumnProps extends {}> {
	desiredState: DataGridState<ColumnProps>
	displayedState: DataGridState<ColumnProps> | undefined
	stateMethods: DataGridStateMethods
	environment: Environment
	pagingInfo: GridPagingInfo
	treeRootId: TreeRootId | undefined,
}

export type DataGridRendererInnerProps<ColumnProps extends {}> = {
	desiredState: DataGridState<ColumnProps>
	displayedState: DataGridState<ColumnProps>
	stateMethods: DataGridStateMethods
	pagingInfo: GridPagingInfo
	environment: Environment
	accessor: EntityListAccessor
	children?: ReactNode
}
