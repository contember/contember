import { Entity } from '@contember/react-binding'
import { Grid } from '@contember/ui'
import { ComponentType, memo, ReactNode } from 'react'
import { DataGridRenderingCommonProps } from '../types'
import { useClassName } from '@contember/react-utils'
import { EmptyMessage, EmptyMessageProps } from '../../../helpers'
import { useMessageFormatter } from '../../../../../../i18n'
import { dataGridDictionary } from '../dict/dataGridDictionary'

export type DataGridTilesPublicProps = {
	tile?: ReactNode
	tileSize?: number
	emptyMessage?: ReactNode
	emptyMessageComponent?: ComponentType<EmptyMessageProps & any> // This can override 'emptyMessage'
}

export type DataGridTilesProps =
	& DataGridRenderingCommonProps
	& DataGridTilesPublicProps

export const DataGridTiles = memo(({ accessor, tileSize = 160, tile, emptyMessage, emptyMessageComponent }: DataGridTilesProps) => {
	const formatMessage = useMessageFormatter(dataGridDictionary)

	return (
		<div className={useClassName('data-grid-body-content-grid')}>
			<Grid columnWidth={tileSize}>
				{!!accessor.length
					? Array.from(accessor, entity => (
						<Entity key={entity.id} accessor={entity}>
							{tile}
						</Entity>
					))
					: (
						<EmptyMessage component={emptyMessageComponent} className="cui-grid-row-full-width">
							{formatMessage(emptyMessage, 'dataGrid.emptyMessage.text')}
						</EmptyMessage>
					)}
			</Grid>
		</div>
	)
})
DataGridTiles.displayName = 'DataGridTiles'
