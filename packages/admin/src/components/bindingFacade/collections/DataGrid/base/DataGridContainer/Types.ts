import { EntityAccessor, EntityId, EntityListBaseProps, EntityName, Filter } from '@contember/binding'
import { ComponentType, ReactNode } from 'react'
import { EmptyMessageProps } from '../../../helpers'
import type { GridPagingAction } from '../../paging'
import { SetDataGridView } from '../DataGridLayout'
import type { DataGridSetColumnFilter } from '../DataGridSetFilter'
import type { DataGridSetIsColumnHidden } from '../DataGridSetIsColumnHidden'
import type { DataGridSetColumnOrderBy } from '../DataGridSetOrderBy'
import type { DataGridState } from '../DataGridState'

export interface DataGridContainerPublicProps {
	allowAggregateFilterControls?: boolean
	allowColumnVisibilityControls?: boolean
	emptyMessage?: ReactNode
	emptyMessageComponent?: ComponentType<EmptyMessageProps & any> // This can override 'emptyMessage'
	emptyMessageComponentExtraProps?: {}
	onEntityClick?: (entity: EntityAccessor) => void
	selectedEntityKeys?: EntityId[]
	tile?: ReactNode
	tileSize?: number
}

export interface DataGridContainerOwnProps extends DataGridContainerPublicProps {
	desiredState: DataGridState
	displayedState: DataGridState
	entityName: EntityName
	filter: Filter
	setFilter: DataGridSetColumnFilter
	setIsColumnHidden: DataGridSetIsColumnHidden
	setLayout: SetDataGridView
	setOrderBy: DataGridSetColumnOrderBy
	updatePaging: (action: GridPagingAction) => void
}

export interface DataGridContainerProps extends DataGridContainerOwnProps, EntityListBaseProps {}
