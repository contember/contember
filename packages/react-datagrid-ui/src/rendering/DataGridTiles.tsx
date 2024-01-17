import { Grid } from '@contember/ui'
import { ComponentType, memo, ReactNode } from 'react'
import { useClassName } from '@contember/react-utils'
import { useMessageFormatter } from '@contember/react-i18n'
import { dataGridDictionary } from '../dict/dataGridDictionary'
import { EmptyMessage, EmptyMessageProps } from '@contember/react-binding-ui'
import { DataViewEachRow, DataViewEmpty } from '@contember/react-dataview'

export type DataGridTilesPublicProps = {
	tile?: ReactNode
	tileSize?: number
	emptyMessage?: ReactNode
	emptyMessageComponent?: ComponentType<EmptyMessageProps & any> // This can override 'emptyMessage'
}

export type DataGridTilesProps =
	& DataGridTilesPublicProps

export const DataGridTiles = memo(({ tileSize = 160, tile, emptyMessage, emptyMessageComponent }: DataGridTilesProps) => {
	const formatMessage = useMessageFormatter(dataGridDictionary)

	return (
		<div className={useClassName('data-grid-body-content-grid')}>
			<Grid columnWidth={tileSize}>
				<DataViewEmpty>
					<EmptyMessage component={emptyMessageComponent} className="cui-grid-row-full-width">
						{formatMessage(emptyMessage, 'dataGrid.emptyMessage.text')}
					</EmptyMessage>
				</DataViewEmpty>
				<DataViewEachRow>
					{tile}
				</DataViewEachRow>
			</Grid>
		</div>
	)
})
DataGridTiles.displayName = 'DataGridTiles'
