import * as React from 'react'
import { ReactNode, useCallback } from 'react'
import { useDataViewEntityListProps, useDataViewFilteringState } from '../contexts'
import {
	EntityListSubTree,
	EntityListSubTreeMarker,
	ReceivedEntityData,
	useBindingOperations,
	useEnvironment,
} from '@contember/react-binding'
import { dataViewSelectionEnvironmentExtension } from '../env/dataViewSelectionEnvironmentExtension'

export const useDataViewFetchAllData = ({ children }: { children: ReactNode }) => {
	const entityName = useDataViewEntityListProps().entityName
	const filter = useDataViewFilteringState().filter
	const env = useEnvironment()
	const bindingOperations = useBindingOperations()

	return useCallback(async (): Promise<{
		marker: EntityListSubTreeMarker
		data: ReceivedEntityData[]
	}> => {
		const entities = {
			entityName,
			filter,
		}
		const node = (
			<EntityListSubTree entities={entities}>
				{children}
			</EntityListSubTree>
		)

		const result = await bindingOperations.fetchData(node, {
			environment: env.withExtension(dataViewSelectionEnvironmentExtension, {}),
		})
		if (!result) {
			throw new Error()
		}
		const { data, markerTreeRoot } = result
		const marker = Array.from(markerTreeRoot.subTrees.values())[0]
		const fieldData = data[marker.placeholderName]
		if (!(marker instanceof EntityListSubTreeMarker) || !Array.isArray(fieldData)) {
			throw new Error()
		}

		return {
			data: fieldData,
			marker,
		}

	}, [entityName, filter, children, bindingOperations, env])
}
