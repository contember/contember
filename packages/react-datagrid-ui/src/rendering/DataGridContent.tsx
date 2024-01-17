import { DataGridTiles, DataGridTilesPublicProps } from './DataGridTiles'
import { DataGridTable, DataGridTablePublicProps } from './DataGridTable'
import { useDataGridLayoutState } from '@contember/react-datagrid'

export type DataGridContentPublicProps =
	& DataGridTablePublicProps
	& DataGridTilesPublicProps

export type DataGridContentProps =
	& DataGridContentPublicProps

export const DataGridContent = (props: DataGridContentProps) => {
	const layout = useDataGridLayoutState()
	if (layout.view === 'tiles' && props.tile) {
		return <DataGridTiles {...props} />
	}
	return <DataGridTable {...props} />
}
