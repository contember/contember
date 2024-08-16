import { ReactNode, useCallback } from 'react'
import * as React from 'react'
import { useDataViewEntityListProps, useDataViewFilteringState } from '../contexts'
import { ContentClient, useCurrentContentGraphQlClient } from '@contember/react-client'
import { EntityListSubTree, EntityListSubTreeMarker, MarkerTreeGenerator, QueryGenerator, createQueryBuilder, useEnvironment } from '@contember/react-binding'
import { dataViewSelectionEnvironmentExtension } from '../env/dataViewSelectionEnvironmentExtension'

export const useDataViewFetchAllData = ({ children }: { children: ReactNode }) => {
	const entityName = useDataViewEntityListProps().entityName
	const filter = useDataViewFilteringState().filter
	const client = useCurrentContentGraphQlClient()
	const env = useEnvironment()

	return useCallback(async () => {
		const entities = {
			entityName,
			filter,
		}
		const node = (
			<EntityListSubTree entities={entities}>
				{children}
			</EntityListSubTree>
		)

		const gen = new MarkerTreeGenerator(node, env.withExtension(dataViewSelectionEnvironmentExtension, {}))
		const qb = createQueryBuilder(env.getSchema())
		const markerTree = gen.generate()

		const queryGenerator = new QueryGenerator(markerTree, qb)
		const query = queryGenerator.getReadQuery()
		const contentClient = new ContentClient(client)
		const marker = Array.from(markerTree.subTrees.values())[0]
		if (!(marker instanceof EntityListSubTreeMarker)) {
			throw new Error()
		}
		return {
			data: (await contentClient.query(query))[marker.placeholderName],
			marker,
		}

	}, [client, children, entityName, env, filter])
}
