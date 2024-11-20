import * as React from 'react'
import { ReactNode } from 'react'
import { Loader } from '../ui/loader'
import { DataViewLoaderState } from '@contember/react-dataview'

export interface DataGridLoaderProps {
	children: ReactNode
}

export const DataGridLoader = ({ children }: DataGridLoaderProps) => (
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


export const DataGridOverlayLoader = () => (
	<Loader position={'absolute'} />
)

export const DataGridInitialLoader = () => (
	<Loader position={'static'} />
)
