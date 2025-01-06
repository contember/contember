import { Serializable, StateStorageOrName } from '@contember/react-utils'
import { Environment, Filter } from '@contember/react-binding'
import { SetStateAction } from 'react'

export type DataViewFilterArtifact = Serializable

export type DataViewSetFilter = <FA extends DataViewFilterArtifact = DataViewFilterArtifact>(key: string, filter: SetStateAction<FA | undefined>) => void

/**
 * Methods for filtering. Available using {@link useDataViewFilteringMethods}.
 */
export type DataViewFilteringMethods = {
	setFilter: DataViewSetFilter
}

export interface DataViewFilterHandlerOptions {
	environment: Environment
}

/**
 * Handler for a filter type.
 * Transforms a filter artifact to a GraphQL filter.
 *
 * You can register a filter handler using {@link DataViewFilteringProps.filterTypes} or using {@link DataViewFilter} component.
 *
 * You can use {@link createFieldFilterHandler} to simplify the creation of a filter handler for a field filter or {@link createFilterHandler} for a generic filter handler.
 *
 * Built-in filter handlers:
 * - {@link createBooleanFilter}
 * - {@link createDateFilter}
 * - {@link createEnumFilter}
 * - {@link createHasManyFilter}
 * - {@link createHasOneFilter}
 * - {@link createIsDefinedFilter}
 * - {@link createNumberFilter}
 * - {@link createNumberRangeFilter}
 * - {@link createTextFilter}
 * - {@link createUnionTextFilter}
 */
export type DataViewFilterHandler<FA extends DataViewFilterArtifact = DataViewFilterArtifact> =
	& ((filterArtifact: FA, options: DataViewFilterHandlerOptions) => Filter | undefined)
	& {
		identifier?: { id: Symbol; params: any }
		isEmpty?: (filterArtifact: FA) => boolean
	}

export type DataViewFilterHandlerRegistry = Record<string, DataViewFilterHandler<any>>

export type DataViewFilteringArtifacts = Record<string, DataViewFilterArtifact>

/**
 * Current state of filtering.
 * Available using {@link useDataViewFilteringState}.
 */
export type DataViewFilteringState = {
	/**
	 * Current state of filtering.
	 */
	artifact: DataViewFilteringArtifacts
	/**
	 * Resolved filter, which can be passed to a query.
	 */
	filter: Filter<never>
	/**
	 * Registered filter types.
	 */
	filterTypes: DataViewFilterHandlerRegistry
}

export type DataViewFilteringProps = {
	/**
	 * Provide filter types.
	 */
	filterTypes?: DataViewFilterHandlerRegistry
	/**
	 * Initial filtering state if not available in storage.
	 * Can be a function to transform the stored state.
	 */
	initialFilters?: DataViewFilteringArtifacts | ((stored: DataViewFilteringArtifacts) => DataViewFilteringArtifacts)
	/**
	 * Storage for filtering state.
	 * Possible values: 'url', 'session', 'local', 'null' or a custom storage.
	 */
	filteringStateStorage?: StateStorageOrName
}
