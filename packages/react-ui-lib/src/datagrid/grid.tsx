import { DataView, DataViewProps } from '@contember/react-dataview'
import * as React from 'react'
import { ReactNode } from 'react'
import { Component } from '@contember/interface'
import { DataGridToolbar } from './toolbar'
import { DataGridLoader } from './loader'
import { DataGridTable } from './table'
import { DataGridPagination } from './pagination'


export type DataGridProps =
	& Omit<DataViewProps, 'children'>
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
			<div>
				{children}
			</div>
		</DataView>
	)
})

export type DefaultDataGridProps =
	& Omit<DataViewProps, 'children'>
	& {
		children: ReactNode
		toolbar?: ReactNode
	}

export const DefaultDataGrid = Component(({ children, toolbar,  ...props }: DefaultDataGridProps) => {
	return (
		<DataGrid {...props}>
			<DataGridToolbar>
				{toolbar}
			</DataGridToolbar>

			<DataGridLoader>
				<DataGridTable>
					{children}
				</DataGridTable>
			</DataGridLoader>

			<DataGridPagination />
		</DataGrid>
	)
})
