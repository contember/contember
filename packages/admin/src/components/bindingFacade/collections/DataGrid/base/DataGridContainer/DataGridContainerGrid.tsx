import { Entity } from '@contember/binding'
import { Card, Grid } from '@contember/ui'
import { useClassName } from '@contember/utilities'
import { memo } from 'react'
import { useMessageFormatter } from '../../../../../../i18n'
import { EmptyMessage } from '../../../helpers'
import { dataGridDictionary } from '../dataGridDictionary'
import { DataGridContainerProps } from './Types'

export type DataGridContainerGridProps =
	Pick<DataGridContainerProps,
		| 'accessor'
		| 'emptyMessage'
		| 'emptyMessageComponent'
		| 'tile'
		| 'tileSize'
	>

export const DataGridContainerGrid = memo(({
	accessor,
	emptyMessage,
	emptyMessageComponent,
	tile,
	tileSize = 160,
}: DataGridContainerGridProps) => {
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
DataGridContainerGrid.displayName = 'DataGridContainerGrid'
