import { EntityListSubTree, Environment, QueryLanguage, SugaredQualifiedEntityList } from '@contember/binding'
import * as React from 'react'
import { DataGridContainer, DataGridSetColumnFilter, DataGridSetColumnOrderBy } from '../base'
import { GridPagingAction } from '../paging'
import { collectFilters } from './collectFilters'
import { collectOrderBy } from './collectOrderBy'
import { DataGridState } from './DataGridState'

export interface RenderGridOptions {
	entities: SugaredQualifiedEntityList['entities']
	setFilter: DataGridSetColumnFilter
	setOrderBy: DataGridSetColumnOrderBy
	updatePaging: (action: GridPagingAction) => void
}

export const renderGrid = (
	{ entities, setFilter, setOrderBy, updatePaging }: RenderGridOptions,
	dataGridState: DataGridState,
	environment: Environment,
): React.ReactElement => {
	const {
		paging: { pageIndex, itemsPerPage },
		filterArtifacts,
		orderDirections,
		columns,
	} = dataGridState
	const desugared = QueryLanguage.desugarQualifiedEntityList({ entities }, environment)
	const columnFilters = collectFilters(columns, filterArtifacts, environment)

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
			orderBy={collectOrderBy(columns, orderDirections, environment)}
			listComponent={DataGridContainer}
			listProps={{
				dataGridState,
				setFilter,
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
