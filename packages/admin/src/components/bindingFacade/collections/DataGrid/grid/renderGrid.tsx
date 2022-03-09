import {
	EntityListSubTree,
	Environment,
	Filter,
	QueryLanguage,
	SugaredQualifiedEntityList,
	TreeRootId,
} from '@contember/binding'
import { Fragment, ReactElement } from 'react'
import {
	DataGridContainer,
	DataGridContainerPublicProps,
	DataGridSetColumnFilter,
	DataGridSetColumnOrderBy,
	DataGridSetIsColumnHidden,
	DataGridState,
} from '../base'
import type { GridPagingAction } from '../paging'
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
	treeRootId: TreeRootId | undefined,
	displayedState: DataGridState,
	desiredState: DataGridState,
	environment: Environment,
): ReactElement => {
	const {
		paging: { pageIndex, itemsPerPage },
		hiddenColumns,
		filterArtifacts,
		orderDirections,
		columns,
	} = displayedState
	const desugared = QueryLanguage.desugarQualifiedEntityList({ entities }, environment)
	const columnFilters = collectFilters(columns, filterArtifacts, environment)

	const filter: Filter = { and: [...columnFilters, desugared.filter ?? {}] }

	return (
		<EntityListSubTree
			entities={{
				...desugared,
				filter,
			}}
			treeRootId={treeRootId}
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
				.filter(([key]) => !hiddenColumns[key])
				.map(([key, props]) => (
					<Fragment key={key}>
						{props.header}
						{props.children}
					</Fragment>
				))}
		</EntityListSubTree>
	)
}
