import { GanttChartDateFilter } from '@app/lib-extra/gantt/filters/date'
import { GanttChart, GanttChartLoader, GanttChartTableWrapper } from '@app/lib-extra/gantt/gantt-chart'
import { GanttChartToolbar } from '@app/lib-extra/gantt/gantt-chart-toolbar'
import { GanttChartTable, GanttChartTableProps } from '@app/lib-extra/gantt/table/gantt-chart-table'
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
