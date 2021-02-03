import { EntityListSubTree, Environment, Filter, QueryLanguage, SugaredQualifiedEntityList } from '@contember/binding'
import * as React from 'react'
import {
	DataGridContainer,
	DataGridContainerPublicProps,
	DataGridSetColumnFilter,
	DataGridSetColumnOrderBy,
	DataGridSetIsColumnHidden,
	DataGridState,
} from '../base'
import { GridPagingAction } from '../paging'
import { collectFilters } from './collectFilters'
import { collectOrderBy } from './collectOrderBy'

export interface RenderGridOptions {
	entities: SugaredQualifiedEntityList['entities']
	setIsColumnHidden: DataGridSetIsColumnHidden
	setFilter: DataGridSetColumnFilter
	setOrderBy: DataGridSetColumnOrderBy
	updatePaging: (action: GridPagingAction) => void
	containerProps: DataGridContainerPublicProps
}

export const renderGrid = (
	{ entities, setIsColumnHidden, setFilter, setOrderBy, updatePaging, containerProps }: RenderGridOptions,
	displayedState: DataGridState,
	desiredState: DataGridState,
	environment: Environment,
): React.ReactElement => {
	const {
		paging: { pageIndex, itemsPerPage },
		hiddenColumns,
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
				desiredState,
				displayedState,
				entityName: desugared.entityName,
				filter,
				setIsColumnHidden,
				setFilter,
				setOrderBy,
				updatePaging,
				emptyMessageComponentExtraProps: containerProps.emptyMessageComponentExtraProps,
				emptyMessageComponent: containerProps.emptyMessageComponent,
				emptyMessage: containerProps.emptyMessage,
			}}
		>
			{Array.from(columns)
				.filter(([key]) => !hiddenColumns.has(key))
				.map(([key, props]) => (
					<React.Fragment key={key}>
						{props.header}
						{props.children}
					</React.Fragment>
				))}
		</EntityListSubTree>
	)
}
