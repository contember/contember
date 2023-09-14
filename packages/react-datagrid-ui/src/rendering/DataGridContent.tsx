import { DataGridRenderingCommonProps } from '../types'
import { DataGridTiles, DataGridTilesPublicProps } from './DataGridTiles'
import { DataGridTable } from './DataGridTable'
import { ComponentType, ReactNode } from 'react'

export const createDataGridContent = <
	TableProps extends {},
	GridProps extends { tile?: ReactNode } = DataGridTilesPublicProps
>({ Table, Grid }: {
	Table: ComponentType<TableProps & DataGridRenderingCommonProps>
	Grid: ComponentType<GridProps & DataGridRenderingCommonProps>
}): ComponentType<TableProps & GridProps & DataGridRenderingCommonProps> => props => {
	if (props.displayedState.layout === 'tiles' && props.tile) {
		return <Grid {...props} />
	}
	return <Table {...props} />
}

export const DataGridContent = createDataGridContent({
	Table: DataGridTable,
	Grid: DataGridTiles,
})
