import { Serializable } from '@contember/react-utils'
import { DataGridColumnKey } from './column'
import { Environment, SugaredFilter } from '@contember/react-binding'

export type DataGridFilterArtifact = Serializable

export type DataGridSetFilter<FA extends DataGridFilterArtifact = DataGridFilterArtifact> = (
	filter: FA | undefined,
) => void

export type DataGridSetColumnFilter<FA extends DataGridFilterArtifact = DataGridFilterArtifact> = (
	columnKey: DataGridColumnKey,
	columnFilter: FA | undefined,
) => void

export interface GetNewFilterOptions<FA extends DataGridFilterArtifact = DataGridFilterArtifact> {
	environment: Environment
}

export type GetNewFilter<FA extends DataGridFilterArtifact = DataGridFilterArtifact> = (
	filterArtifact: FA,
	options: GetNewFilterOptions<FA>,
) => SugaredFilter | undefined

export type DataGridFilterArtifactStore = Record<DataGridColumnKey, DataGridFilterArtifact>
