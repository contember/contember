import { EntityListSubTree, Environment, Filter, QueryLanguage, SugaredQualifiedEntityList } from '@contember/binding'
import * as React from 'react'
import {
	DataGridContainer,
	DataGridContainerPublicProps,
	DataGridSetColumnFilter,
	DataGridSetColumnOrderBy,
} from '../base'
import { GridPagingAction } from '../paging'
import { collectFilters } from './collectFilters'
import { collectOrderBy } from './collectOrderBy'
import { DataGridState } from './DataGridState'

export interface RenderGridOptions {
	entities: SugaredQualifiedEntityList['entities']
	setFilter: DataGridSetColumnFilter
	setOrderBy: DataGridSetColumnOrderBy
	updatePaging: (action: GridPagingAction) => void
	containerProps: DataGridContainerPublicProps
}

export const renderGrid = (
	{ entities, setFilter, setOrderBy, updatePaging, containerProps }: RenderGridOptions,
	displayedState: DataGridState,
	desiredState: DataGridState,
	environment: Environment,
): React.ReactElement => {
	const {
		paging: { pageIndex, itemsPerPage },
		filterArtifacts,
		orderDirections,
		columns,
	} = displayedState
	const desugared = QueryLanguage.desugarQualifiedEntityList({ entities }, environment)
	const columnFilters = collectFilters(columns, filterArtifacts, environment)

	const filter: Filter | undefined =
		desugared.filter && columnFilters ? { and: [desugared.filter, columnFilters] } : desugared.filter ?? columnFilters

	return (
		<EntityListSubTree
			entities={{
				...desugared,
				filter,
			}}
			offset={itemsPerPage === null ? undefined : itemsPerPage * pageIndex}
			limit={itemsPerPage === null ? undefined : itemsPerPage}
			orderBy={collectOrderBy(columns, orderDirections, environment)}
			listComponent={DataGridContainer}
			listProps={{
				dataGridState: desiredState,
				entityName: desugared.entityName,
				filter,
				setFilter,
				setOrderBy,
				updatePaging,
				emptyMessageComponentExtraProps: containerProps.emptyMessageComponentExtraProps,
				emptyMessageComponent: containerProps.emptyMessageComponent,
				emptyMessage: containerProps.emptyMessage,
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
