import { Serializable, StateStorageOrName } from '@contember/react-utils'
import { Environment, SugaredFilter } from '@contember/react-binding'
import { Filter } from '@contember/binding'
import { SetStateAction } from 'react'

export type DataViewFilterArtifact = Serializable

export type DataViewSetFilter<FA extends DataViewFilterArtifact = DataViewFilterArtifact> = (
	filter: FA | undefined,
) => void

export type DataViewSetColumnFilter<FA extends DataViewFilterArtifact = DataViewFilterArtifact> = (
	key: string,
	columnFilter: FA | undefined,
) => void

export type DataViewFilteringMethods = {
	setFilter: <FA extends DataViewFilterArtifact = DataViewFilterArtifact>(key: string, filter: SetStateAction<FA | undefined>) => void
}

export interface DataViewFilterHandlerOptions<FA extends DataViewFilterArtifact = DataViewFilterArtifact> {
	environment: Environment
}

export type DataViewFilterHandler<FA extends DataViewFilterArtifact = DataViewFilterArtifact> =
	& ((filterArtifact: FA, options: DataViewFilterHandlerOptions<FA>) => Filter | undefined)
	& {
		identifier?: { id: Symbol; params: any }
		isEmpty?: (filterArtifact: FA) => boolean
	}

export type DataViewFilterHandlerRegistry = Record<string, DataViewFilterHandler<any>>

export type DataViewFilteringArtifacts = Record<string, DataViewFilterArtifact>
export type DataViewFilteringState = {
	artifact: DataViewFilteringArtifacts
	filter: Filter<never>
	filterTypes: DataViewFilterHandlerRegistry
}

export type DataViewFilteringProps = {
	filterTypes?: DataViewFilterHandlerRegistry
	initialFilters?: DataViewFilteringArtifacts | ((stored: DataViewFilteringArtifacts) => DataViewFilteringArtifacts)
	filteringStateStorage?: StateStorageOrName
}
