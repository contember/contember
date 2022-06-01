import { Entity } from '@contember/binding'
import { Grid, useComponentClassName } from '@contember/ui'
import { memo } from 'react'
import { DataGridContainerProps } from './Types'

interface DataGridContainerGridProps
  extends Pick<
		DataGridContainerProps,
		| 'accessor'
		| 'tile'
	> {
    tileSize: NonNullable<DataGridContainerProps['tileSize']>
  }

export const DataGridContainerGrid = memo(({
  accessor,
  tileSize,
  tile,
}: DataGridContainerGridProps) => (
  <div className={useComponentClassName('data-grid-body-content-grid')}>
    <Grid columnWidth={tileSize}>
      {!!accessor.length && Array.from(accessor, entity => (
        <Entity
          key={entity.id ?? entity.key}
          accessor={entity}
        >
          {tile}
        </Entity>
      ))}
    </Grid>
  </div>
))
DataGridContainerGrid.displayName = 'DataGridContainerGrid'
