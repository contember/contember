import { Entity } from '@contember/binding'
import { Grid } from '@contember/ui'
import { useClassName } from '@contember/utilities'
import { memo } from 'react'
import { DataGridContainerProps } from './Types'

export type DataGridContainerGridProps =
	Pick<DataGridContainerProps,
		| 'accessor'
		| 'tile'
		| 'tileSize'
	>

export const DataGridContainerGrid = memo(({
	accessor,
	tileSize = 160,
	tile,
}: DataGridContainerGridProps) => (
	<div className={useClassName('data-grid-body-content-grid')}>
		<Grid columnWidth={tileSize}>
			{!!accessor.length && Array.from(accessor, entity => (
				<Entity key={entity.id} accessor={entity}>
					{tile}
				</Entity>
			))}
		</Grid>
	</div>
))
DataGridContainerGrid.displayName = 'DataGridContainerGrid'
