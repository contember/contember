import { GanttChartProvider } from '@app/lib-extra/gantt/gantt-chart-provider'
import { DataGridInitialLoader, DataGridOverlayLoader, DataGridProps, dataGridDefaultStorages } from '@app/lib/datagrid'
import { dict } from '@app/lib/dict'
import { Component } from '@contember/interface'
import { DataView, DataViewLayout, DataViewLoaderState } from '@contember/react-dataview'
import { LayoutGridIcon } from 'lucide-react'
import * as React from 'react'
import { ReactNode } from 'react'

export const GanttChart = Component(({ children, ...props }: DataGridProps) => {
	return (
		<DataView {...dataGridDefaultStorages} {...props}>
			<GanttChartProvider>{children}</GanttChartProvider>
		</DataView>
	)
})

export const GanttChartLoader = ({ children }: { children: ReactNode }) => (
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

export const GanttChartTableWrapper = Component(({ children }: { children: ReactNode }) => {
	return (
		<DataViewLayout
			name={'gantt'}
			label={
				<>
					<LayoutGridIcon className={'w-3 h-3'} />
					<span>{dict.datagrid.showGrid}</span>
				</>
			}
		>
			{children}
		</DataViewLayout>
	)
})
