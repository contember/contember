import type { Environment, SugaredFilter } from '@contember/react-binding'
import type { DataGridFilterArtifact } from './DataGridFilterArtifact'

export interface GetNewFilterOptions<FA extends DataGridFilterArtifact = DataGridFilterArtifact> {
	environment: Environment
}

export type GetNewFilter<FA extends DataGridFilterArtifact = DataGridFilterArtifact> = (
	filterArtifact: FA,
	options: GetNewFilterOptions<FA>,
) => SugaredFilter | undefined
