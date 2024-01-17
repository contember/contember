import { memo, ReactNode, useEffect, useMemo } from 'react'
import { SugaredQualifiedEntityList } from '@contember/binding'
import { EntityListBaseProps, EntityListSubTree, EnvironmentContext, TreeRootIdProvider } from '@contember/react-binding'
import { DataViewDisplayedStateContext, DataViewEntityListAccessorContext, DataViewLoaderStateContext } from '../contexts'
import { useEntityListSubTreeLoader } from '../hooks/useEntityListSubTreeLoader'
import { DataViewState } from '../../types'

export interface DataViewLoaderProps {
	children: ReactNode
	state: DataViewState
}

const ListSubTreeInner = memo(({ accessor, children }: EntityListBaseProps) => {
	return (
		<EnvironmentContext.Provider value={accessor.environment}>
			<DataViewEntityListAccessorContext.Provider value={accessor}>
				{children}
			</DataViewEntityListAccessorContext.Provider>
		</EnvironmentContext.Provider>
	)
})

export const DataViewLoader = ({ children, state }: DataViewLoaderProps) => {

	const resolvedFilters = state.filtering.filter
	const orderBy = state.sorting.orderBy
	const paging = state.paging
	const entities = state.entities
	const entityListProps = useMemo((): SugaredQualifiedEntityList => {
		return {
			entities: {
				...entities,
				filter: resolvedFilters,
			},
			orderBy,
			offset: paging.itemsPerPage === null ? undefined : paging.itemsPerPage * paging.pageIndex,
			limit: paging.itemsPerPage === null ? undefined : paging.itemsPerPage,
		}
	}, [entities, resolvedFilters, orderBy, paging.itemsPerPage, paging.pageIndex])

	const [loadedEntityList, loadState] = useEntityListSubTreeLoader(entityListProps, children, state)

	return (
		<DataViewLoaderStateContext.Provider value={loadState}>
			<DataViewDisplayedStateContext.Provider value={loadedEntityList.state}>
				{!loadedEntityList.entities
					? children
					: (
						<TreeRootIdProvider treeRootId={loadedEntityList.treeRootId}>
							<EntityListSubTree
								{...loadedEntityList.entities}
								treeRootId={loadedEntityList.treeRootId}
								listComponent={ListSubTreeInner}
								children={children}
							/>
						</TreeRootIdProvider>
					)
				}
			</DataViewDisplayedStateContext.Provider>
		</DataViewLoaderStateContext.Provider>
	)
}
