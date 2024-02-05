import { memo, ReactNode, useMemo } from 'react'
import { SugaredQualifiedEntityList } from '@contember/binding'
import {
	Component,
	EntityListSubTree,
	EnvironmentContext, EnvironmentMiddleware,
	TreeRootIdProvider,
	useEntityListSubTree,
	useEntityListSubTreeLoader,
} from '@contember/react-binding'
import {
	DataViewDisplayedStateContext,
	DataViewEntityListAccessorContext,
	DataViewLoaderStateContext,
	DataViewSelectionStateContext,
} from '../../contexts'
import { DataViewState } from '../../types'
import { dataViewSelectionEnvironmentExtension } from '../../dataViewSelectionEnvironmentExtension'

export interface DataViewLoaderProps {
	children: ReactNode
	state: DataViewState
}

const ExistingEntityListSubtree = memo(({ entities, children }: {
	entities: SugaredQualifiedEntityList
	children: ReactNode
}) => {
	const accessor = useEntityListSubTree(entities)
	return (
		<EnvironmentContext.Provider value={accessor.environment}>
			<DataViewEntityListAccessorContext.Provider value={accessor}>
				{children}
			</DataViewEntityListAccessorContext.Provider>
		</EnvironmentContext.Provider>
	)
})
const NonExistingEntityListSubtree = memo(({ children }: {
	children: ReactNode
}) => {
	return (
		<DataViewEntityListAccessorContext.Provider value={undefined}>
			{children}
		</DataViewEntityListAccessorContext.Provider>
	)
})

export const DataViewLoader = Component(({ children, state }: DataViewLoaderProps) => {

	const resolvedFilters = state.filtering.filter
	const orderBy = state.sorting.orderBy
	const paging = state.paging
	const entities = state.entities
	const entityListProps = useMemo((): SugaredQualifiedEntityList => {
		return createEntityListProps(entities, resolvedFilters, orderBy, paging.itemsPerPage, paging.pageIndex)
	}, [entities, resolvedFilters, orderBy, paging.itemsPerPage, paging.pageIndex])

	const [loadedEntityList, loadState] = useEntityListSubTreeLoader(entityListProps, children, state)

	return (
		<DataViewLoaderStateContext.Provider value={loadState}>
			<DataViewSelectionStateContext.Provider value={loadedEntityList.state?.selection}>
				<DataViewDisplayedStateContext.Provider value={loadedEntityList.state}>
					<TreeRootIdProvider treeRootId={loadedEntityList.treeRootId}>
						{!loadedEntityList.entities
							? <NonExistingEntityListSubtree children={children} />
							: (
								<ExistingEntityListSubtree
									entities={loadedEntityList.entities}
									children={children}
								/>
							)
						}</TreeRootIdProvider>
				</DataViewDisplayedStateContext.Provider>
			</DataViewSelectionStateContext.Provider>
		</DataViewLoaderStateContext.Provider>
	)
}, ({ state, children }) => {
	const entityListProps = createEntityListProps(
		state.entities,
		state.filtering.filter,
		state.sorting.orderBy,
		state.paging.itemsPerPage,
		state.paging.pageIndex,
	)
	return (
		<EnvironmentMiddleware create={it => it.withExtension(dataViewSelectionEnvironmentExtension, state.selection)}>
			<EntityListSubTree {...entityListProps}>{children}</EntityListSubTree>
		</EnvironmentMiddleware>
	)
})

const createEntityListProps = (
	entities: DataViewState['entities'],
	resolvedFilters: DataViewState['filtering']['filter'],
	orderBy: DataViewState['sorting']['orderBy'],
	itemsPerPage: DataViewState['paging']['itemsPerPage'],
	pageIndex: DataViewState['paging']['pageIndex'],
): SugaredQualifiedEntityList => {
	return {
		entities: {
			...entities,
			filter: resolvedFilters,
		},
		orderBy,
		offset: itemsPerPage === null ? undefined : itemsPerPage * pageIndex,
		limit: itemsPerPage === null ? undefined : itemsPerPage,
	}
}
