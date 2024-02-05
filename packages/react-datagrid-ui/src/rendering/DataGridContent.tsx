import { DataGridTiles, DataGridTilesPublicProps } from './DataGridTiles'
import { DataGridTable, DataGridTablePublicProps } from './DataGridTable'
import { useDataGridLayout } from '@contember/react-datagrid'

export type DataGridContentPublicProps =
	& DataGridTablePublicProps
	& DataGridTilesPublicProps

export type DataGridContentProps =
	& DataGridContentPublicProps

export const DataGridContent = (props: DataGridContentProps) => {
	const layout = useDataGridLayout()
	if (layout === 'tiles' && props.tile) {
		return <DataGridTiles {...props} />
	}
	return <DataGridTable {...props} />
}
