import { Environment, Filter, QualifiedEntityList } from '@contember/react-binding'
import { useMemo } from 'react'
import { useEnvironment } from '@contember/react-binding'
import { DataViewFilterHandlerRegistry, DataViewFilteringArtifacts } from '../../types'
import { replaceGraphQlLiteral } from '@contember/client'

export type UseDataViewResolvedFiltersArgs = {
	filters: DataViewFilteringArtifacts
	filterTypes?: DataViewFilterHandlerRegistry
	entities: QualifiedEntityList
}

export const useDataViewResolvedFilters = ({
	entities,
	filterTypes,
	filters,
}: UseDataViewResolvedFiltersArgs) => {
	const environment = useEnvironment()

	return useMemo((): Filter<never> => {
		return resolveFilters({ filterTypes, filters, environment, entities })
	}, [filterTypes, filters, environment, entities])
}


export const resolveFilters = ({ filterTypes, filters, environment, entities }: UseDataViewResolvedFiltersArgs & { environment: Environment }): Filter<never> => {
	const ands: Filter[] = []
	for (const [key, value] of Object.entries(filters)) {
		const handler = filterTypes?.[key]
		if (handler === undefined) {
			continue
		}
		if (handler?.isEmpty?.(value)) {
			continue
		}
		const filter = handler(value, { environment })
		if (filter === undefined) {
			continue
		}
		ands.push(filter)
	}

	return replaceGraphQlLiteral<unknown>({ and: [...ands, entities.filter ?? {}] }) as Filter<never>
}
