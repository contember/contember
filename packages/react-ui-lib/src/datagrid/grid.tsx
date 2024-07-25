import { DataView, DataViewLoaderState, DataViewProps } from '@contember/react-dataview'
import * as React from 'react'
import { Fragment, ReactNode } from 'react'
import { DataGridInitialLoader, DataGridOverlayLoader } from './loader'
import { Component } from '@contember/interface'


export type DataGridProps =
	& Omit<DataViewProps, 'children' | 'filterTypes'>
	& {
		children: ReactNode
	}

export const dataGridDefaultStorages: Partial<DataGridProps> = {
	filteringStateStorage: 'session',
	sortingStateStorage: 'session',
	currentPageStateStorage: 'session',
	selectionStateStorage: 'local',
	pagingSettingsStorage: 'local',
}

export const DataGrid = Component(({ children, ...props }: DataGridProps) => {
	return (
		<DataView
			{...dataGridDefaultStorages}
			{...props}
		>
			{children}
		</DataView>
	)
})

export interface DataViewBodyProps {
	children: ReactNode
}

export const DataGridLoader = ({ children }: DataViewBodyProps) => (
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
	</>
)


