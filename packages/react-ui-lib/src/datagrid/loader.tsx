import * as React from 'react'
import { ReactNode } from 'react'
import { Loader } from '@contember/react-ui-lib-base'
import { DataViewLoaderState } from '@contember/react-dataview'

/**
 * Props for the {@link DataGridLoader} component.
 */
export interface DataGridLoaderProps {
	children: ReactNode
}

/**
 * `DataGridLoader` manages the loading state for a data grid, displaying appropriate loaders
 * based on the current state (refreshing, initial load, or failure).
 *
 * ## Example: Basic Usage
 * ```tsx
 * <DataGridLoader>
 *     <DataGridTable>
 *         <DataGridTextColumn header="Title" field="title" />
 *     </DataGridTable>
 * </DataGridLoader>
 * ```
 */
export const DataGridLoader = ({ children }: { children: ReactNode }) => (
	<>
		<DataViewLoaderState refreshing loaded>
			<div className="relative">
				<DataViewLoaderState refreshing>
					<DataGridOverlayLoader />
				</DataViewLoaderState>
				{children}
			</div>
		</DataViewLoaderState>
		<DataViewLoaderState initial>
			<DataGridInitialLoader />
		</DataViewLoaderState>
		<DataViewLoaderState failed>
			<div>Failed to load data</div>
		</DataViewLoaderState>
	</>
)

const DataGridOverlayLoader = () => <Loader position={'absolute'} />

const DataGridInitialLoader = () => <Loader position={'static'} />
