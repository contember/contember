import { Component } from '@contember/interface'
import { DataViewEachRow, DataViewLayout } from '@contember/react-dataview'
import * as React from 'react'
import { dict } from '@contember/react-ui-lib-base'
import { LayoutGridIcon } from 'lucide-react'
import { cn } from '@contember/react-ui-lib-base'

/**
 * Props for the {@link DataGridTiles} component.
 */
export interface DataGridTilesProps {
	children: React.ReactNode
	className?: string
}

/**
 * `DataGridTiles` provides a simple grid layout for `DataView`, enabling a tile-based display.
 * It must be used within a `DataView` context.
 *
 * ## Example: Basic usage
 * ```tsx
 * <DataGridTiles>
 *   <MyCustomTile />
 * </DataGridTiles>
 * ```
 */
export const DataGridTiles = Component<DataGridTilesProps>(({ children, className }) => {
	return (
		<DataViewLayout
			name={'grid'}
			label={
				<>
					<LayoutGridIcon className={'w-3 h-3'} />
					<span>{dict.datagrid.showGrid}</span>
				</>
			}
		>
			<div className={cn('grid grid-cols-2 md:grid-cols-4 gap-4', className)}>
				<DataViewEachRow>
					{children}
				</DataViewEachRow>
			</div>
		</DataViewLayout>
	)
})
