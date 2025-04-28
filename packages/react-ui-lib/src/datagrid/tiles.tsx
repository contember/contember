import { Component } from '@contember/interface'
import { DataViewEachRow, DataViewLayout } from '@contember/react-dataview'
import { LayoutGridIcon } from 'lucide-react'
import { dict } from '../dict'
import { uic } from '../utils'

const DataGridTilesLayout = uic('div', {
	baseClass: 'grid grid-cols-2 md:grid-cols-4 gap-4',
})

const DataGridTilesLabel = () => (
	<>
		<LayoutGridIcon className={'w-3 h-3'} />
		<span>{dict.datagrid.showGrid}</span>
	</>
)

/**
 * Props for the {@link DataGridTiles} component.
 */
export type DataGridTilesProps = {
	children: React.ReactNode
	className?: string
}

/**
 * `DataGridTiles` provides a simple grid layout for `DataView`, enabling a tile-based display.
 * It must be used within a `DataView` context.
 *
 * #### Example: Basic usage
 * ```tsx
 * <DataGridTiles>
 *   <MyCustomTile />
 * </DataGridTiles>
 * ```
 */
export const DataGridTiles = Component<DataGridTilesProps>(({ children, className }) => (
	<DataViewLayout name={'grid'} label={<DataGridTilesLabel />}>
		<DataGridTilesLayout className={className}>
			<DataViewEachRow>
				{children}
			</DataViewEachRow>
		</DataGridTilesLayout>
	</DataViewLayout>
))
