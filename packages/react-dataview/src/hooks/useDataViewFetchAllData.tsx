import * as React from 'react'
import { ReactNode, useCallback } from 'react'
import { useDataViewEntityListProps, useDataViewFilteringState } from '../contexts'
import {
	Component,
	EntityFieldsWithHoistablesMarker,
	EntityListSubTree,
	EntityListSubTreeMarker,
	MarkerFactory,
	ReceivedEntityData,
	useBindingOperations,
	useEnvironment,
} from '@contember/react-binding'
import { dataViewSelectionEnvironmentExtension } from '../env/dataViewSelectionEnvironmentExtension'
import { DataViewSelectionValues } from '../types'

/**
 * Hook for fetching all data matching the current filter. Used for exporting data.
 */
export const useDataViewFetchAllData = ({ children, selection }: { children: ReactNode; selection?: DataViewSelectionValues }) => {
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
				<OmitSubTrees>
					{children}
				</OmitSubTrees>
			</EntityListSubTree>
		)

		const { data, markerTreeRoot } = await bindingOperations.fetchData(node, {
			environment: env.withExtension(dataViewSelectionEnvironmentExtension, selection ?? {}),
		})
		const marker = Array.from(markerTreeRoot.subTrees.values())[0]
		const fieldData = data[marker.placeholderName]
		if (!(marker instanceof EntityListSubTreeMarker) || !Array.isArray(fieldData)) {
			throw new Error()
		}

		return {
			data: fieldData,
			marker,
		}

	}, [entityName, filter, children, bindingOperations, env, selection])
}

const OmitSubTrees = Component<{ children: ReactNode }>(
	props => {
		return null
	},
	{
		staticRender: props => <>{props.children}</>,
		generateBranchMarker: (props, fields, environment) => {
			const fieldsWithHoistablesMarker = MarkerFactory.createEntityFieldsWithHoistablesMarker(fields, environment)

			return new EntityFieldsWithHoistablesMarker(fieldsWithHoistablesMarker.fields, undefined, fieldsWithHoistablesMarker.parentReference)
		},
	},
)
