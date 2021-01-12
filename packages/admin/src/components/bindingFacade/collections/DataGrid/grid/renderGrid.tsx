import { EntityListSubTree } from '@contember/binding'
import * as React from 'react'
import { DataGridContainer, DataGridSetColumnOrderBy } from '../base'
import { GridPagingAction } from '../paging'
import { collectFilters } from './collectFilters'
import { collectOrderBys } from './collectOrderBys'
import { DataGridState } from './DataGridState'

export interface RenderGridOptions {
	entityName: string
	setOrderBy: DataGridSetColumnOrderBy
	updatePaging: (action: GridPagingAction) => void
}

export const renderGrid = (
	{ entityName, setOrderBy, updatePaging }: RenderGridOptions,
	dataGridState: DataGridState,
): React.ReactElement => {
	const {
		paging: { pageIndex, itemsPerPage },
		filters,
		orderBys,
		columns,
	} = dataGridState
	return (
		<EntityListSubTree
			entities={{
				entityName,
				filter: collectFilters(filters),
			}}
			offset={itemsPerPage === null ? undefined : itemsPerPage * pageIndex}
			limit={itemsPerPage === null ? undefined : itemsPerPage}
			orderBy={collectOrderBys(orderBys)}
			listComponent={DataGridContainer}
			listProps={{
				dataGridState,
				setOrderBy,
				updatePaging,
			}}
		>
			{Array.from(columns, ([key, props]) => (
				<React.Fragment key={key}>
					{props.header}
					{props.children}
				</React.Fragment>
			))}
		</EntityListSubTree>
	)
}
