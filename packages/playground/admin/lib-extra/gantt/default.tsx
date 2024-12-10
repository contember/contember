import { GanttChartDateFilter } from './filters/date'
import { GanttChart, GanttChartLoader, GanttChartTableWrapper } from './gantt-chart'
import { GanttChartToolbar } from './gantt-chart-toolbar'
import { GanttChartTable, GanttChartTableProps } from './table/gantt-chart-table'
import { DataGridProps } from '@app/lib/datagrid'
import { Component } from '@contember/interface'

export type DefaultGanttProps = Omit<DataGridProps, 'children'> & GanttChartTableProps

export const DefaultGanttChart = Component<DefaultGanttProps>(
	({
		discriminationEntity,
		discriminationField,
		discriminationLabel,
		activityLabel,
		startTimeField,
		endTimeField,
		startTime,
		endTime,
		blockSize,
		slotsLength,
		showCurrentTime,
		createActivityForm,
		editActivityForm,
		...props
	}) => (
		<GanttChart {...props}>
			<GanttChartToolbar>
				<GanttChartDateFilter field={startTimeField} label="Date" />
			</GanttChartToolbar>
			<GanttChartLoader>
				<GanttChartTableWrapper>
					<GanttChartTable
						discriminationEntity={discriminationEntity}
						discriminationField={discriminationField}
						discriminationLabel={discriminationLabel}
						activityLabel={activityLabel}
						startTimeField={startTimeField}
						endTimeField={endTimeField}
						startTime={startTime}
						endTime={endTime}
						blockSize={blockSize}
						slotsLength={slotsLength}
						showCurrentTime={showCurrentTime}
						createActivityForm={createActivityForm}
						editActivityForm={editActivityForm}
					/>
				</GanttChartTableWrapper>
			</GanttChartLoader>
		</GanttChart>
	),
)
