import { DataGridColumnKey } from './DataGridColumnKey'
import { DataGridFilterArtifact } from './DataGridFilterArtifact'

export type DataGridSetFilter<FA extends DataGridFilterArtifact = DataGridFilterArtifact> = (
	filter: FA | undefined,
) => void

export type DataGridSetColumnFilter<FA extends DataGridFilterArtifact = DataGridFilterArtifact> = (
	columnKey: DataGridColumnKey,
	columnFilter: FA | undefined,
) => void
