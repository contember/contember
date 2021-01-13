import { EntityListSubTree, Environment, QueryLanguage, SugaredQualifiedEntityList } from '@contember/binding'
import * as React from 'react'
import { DataGridContainer, DataGridSetColumnOrderBy } from '../base'
import { GridPagingAction } from '../paging'
import { collectFilters } from './collectFilters'
import { collectOrderBys } from './collectOrderBys'
import { DataGridState } from './DataGridState'

export interface RenderGridOptions {
	entities: SugaredQualifiedEntityList['entities']
	setOrderBy: DataGridSetColumnOrderBy
	updatePaging: (action: GridPagingAction) => void
}

export const renderGrid = (
	{ entities, setOrderBy, updatePaging }: RenderGridOptions,
	dataGridState: DataGridState,
	environment: Environment,
): React.ReactElement => {
	const {
		paging: { pageIndex, itemsPerPage },
		filters,
		orderBys,
		columns,
	} = dataGridState
	const desugared = QueryLanguage.desugarQualifiedEntityList({ entities }, environment)
	const columnFilters = collectFilters(filters)

	return (
		<EntityListSubTree
			entities={{
				...desugared,
				filter:
					desugared.filter && columnFilters
						? { and: [desugared.filter, columnFilters] }
						: desugared.filter ?? columnFilters,
			}}
			offset={itemsPerPage === null ? undefined : itemsPerPage * pageIndex}
			limit={itemsPerPage === null ? undefined : itemsPerPage}
			orderBy={collectOrderBys(columns, orderBys)}
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
