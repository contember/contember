import { Component } from '@contember/interface'
import {
	DataViewDateFilter,
	DataViewDateFilterInput,
	DataViewDateFilterProps,
	DataViewDateFilterResetTrigger,
	DataViewNullFilterTrigger,
	DateRangeFilterArtifacts,
	useDataViewFilter,
	useDataViewFilterName,
} from '@contember/react-dataview'
import { XIcon } from 'lucide-react'
import * as React from 'react'
import { ReactNode, useId } from 'react'
import { Temporal } from 'temporal-polyfill'
import { dict } from '../../dict'
import { formatDate } from '../../formatting'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover'
import { cn } from '../../utils'
import { DataViewFieldLabel } from '../labels'
import { DataGridActiveFilterUI, DataGridFilterSelectTriggerUI, DataGridSingleFilterUI } from '../ui'
import { DataGridNullFilter } from './common'
import { DataGridFilterMobileHiding } from './mobile'

export type DataGridPredefinedDateRange = { start: string; end: string; label: ReactNode }

/**
 * Props for {@link DataGridDateFilter}.
 */
export type DataGridDateFilterProps =
	& Omit<DataViewDateFilterProps, 'children'>
	& {
		label: ReactNode
		ranges?: DataGridPredefinedDateRange[]
	}

/**
 * Date filter for DataGrid with default UI.
 *
 * ## Props {@link DataGridDateFilterProps}
 * field, label, ?ranges, ?name
 *
 * ## Example
 * ```tsx
 * <DataGridDateFilter field={'createdAt'} label="Created at" />
 * ```
 */
export const DataGridDateFilter = Component(({ label, ranges, ...props }: DataGridDateFilterProps) => (
	<DataViewDateFilter {...props}>
		<DataGridFilterMobileHiding>
			<DataGridSingleFilterUI>
				<DataGridDateFilterSelect label={label ?? <DataViewFieldLabel field={props.field} />} ranges={ranges} />
				<DataGridDateFilterList />
			</DataGridSingleFilterUI>
		</DataGridFilterMobileHiding>
	</DataViewDateFilter>
))

const DataGridDateFilterRange = () => {
	const [artifact] = useDataViewFilter<DateRangeFilterArtifacts>(useDataViewFilterName())

	if (!artifact) {
		return null
	}

	const { start, end } = artifact
	const startFormatted = start ? formatDate(start) : undefined
	const endFormatted = end ? formatDate(end) : undefined

	if (startFormatted !== undefined && endFormatted !== undefined) {
		return `${startFormatted} – ${endFormatted}`
	}

	if (startFormatted !== undefined) {
		return `≥ ${startFormatted}`
	}

	if (endFormatted !== undefined) {
		return `≤ ${endFormatted}`
	}

	return undefined
}


const DataGridDateFilterList = () => (
	<>
		<DataViewDateFilterResetTrigger>
			<DataGridActiveFilterUI>
				<DataGridDateFilterRange />
			</DataGridActiveFilterUI>
		</DataViewDateFilterResetTrigger>

		<DataViewNullFilterTrigger action={'unset'}>
			<DataGridActiveFilterUI>
				<span className={'italic'}>{dict.datagrid.na}</span>
			</DataGridActiveFilterUI>
		</DataViewNullFilterTrigger>
	</>
)

/**
 * Utility function to create a predefined date range
 */
export const createDataGridDateRange = (label: ReactNode, dayDeltaStart: number, dayDeltaEnd: number): DataGridPredefinedDateRange => {
	const start = new Date(new Date().setDate(new Date().getDate() + dayDeltaStart))
	const end = new Date(new Date().setDate(new Date().getDate() + dayDeltaEnd))
	return {
		label,
		start: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`,
		end: `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`,
	}
}

const now = Temporal.Now.plainDateISO()
const lastMonth = now.subtract({ months: 1 })
const nextMonth = now.add({ months: 1 })
const lastYear = now.subtract({ years: 1 })
const nextYear = now.add({ years: 1 })

export const dataGridRanges = {
	yesterday: createDataGridDateRange(dict.datagrid.yesterday, -1, -1),
	today: createDataGridDateRange(dict.datagrid.today, 0, 0),
	tomorrow: createDataGridDateRange(dict.datagrid.tomorrow, 1, 1),
	thisWeek: createDataGridDateRange(dict.datagrid.thisWeek, 1 - now.dayOfWeek, 6 - now.dayOfWeek),
	lastWeek: createDataGridDateRange(dict.datagrid.lastWeek, 1 - now.dayOfWeek - 7, 6 - now.dayOfWeek - 7),
	nextWeek: createDataGridDateRange(dict.datagrid.nextWeek, 1 - now.dayOfWeek + 7, 6 - now.dayOfWeek + 7),
	thisMonth: createDataGridDateRange(dict.datagrid.thisMonth, 1 - now.day, now.daysInMonth - now.day),
	lastMonth: createDataGridDateRange(dict.datagrid.lastMonth, 1 - now.day - lastMonth.daysInMonth, -now.day),
	nextMonth: createDataGridDateRange(dict.datagrid.nextMonth, 1 - now.day + nextMonth.daysInMonth, now.daysInMonth - now.day + nextMonth.daysInMonth),
	thisYear: createDataGridDateRange(dict.datagrid.thisYear, 1 - now.dayOfYear, now.daysInYear - now.dayOfYear),
	lastYear: createDataGridDateRange(dict.datagrid.lastYear, 1 - now.dayOfYear - lastYear.daysInYear, -now.dayOfYear),
	nextYear: createDataGridDateRange(dict.datagrid.nextYear, 1 - now.dayOfYear + nextYear.daysInYear, now.daysInYear - now.dayOfYear + nextYear.daysInYear),
}

const defaultRanges = [createDataGridDateRange(dict.datagrid.today, 0, 0)]

const DataGridDateFilterSelect = ({ label, ranges = defaultRanges }: {
	label?: ReactNode
	ranges?: DataGridPredefinedDateRange[]
}) => {
	return (
		<Popover>
			<PopoverTrigger asChild>
				<DataGridFilterSelectTriggerUI>{label}</DataGridFilterSelectTriggerUI>
			</PopoverTrigger>
			<PopoverContent className="p-0">
				<div className="flex">
					{ranges?.length > 0 && <div className="flex flex-col gap-2 bg-gray-50 p-4 border-r">
						{ranges.map(({ start, end, label }) => (
							<DataGridRangeFilter start={start} end={end} label={label} key={`${start}-${end}`} />
						))}
					</div>}
					<DataGridDateFilterControls layout={ranges?.length > 0 ? 'column' : 'row'} />
				</div>
			</PopoverContent>
		</Popover>
	)
}


const DataGridRangeFilter = ({ start, end, label }: DataGridPredefinedDateRange) => {
	const name = useDataViewFilterName()
	const [filter, setFilter] = useDataViewFilter<DateRangeFilterArtifacts>(name)
	const isActive = filter?.start === start && filter?.end === end
	return (
		<Button
			variant="outline"
			size="sm"
			className={cn({ 'shadow-inner bg-gray-100': isActive })}
			onClick={() => {
				setFilter({ start, end })
			}}
		>{label}</Button>
	)
}

/**
 * @internal
 */
export const DataGridDateFilterControls = ({ layout }: { layout?: 'row' | 'column' }) => {
	const id = useId()

	return (
		<div className={'flex flex-col'}>
			<div className={layout === 'row' ? 'flex gap-4 px-4 py-2' : 'flex flex-col px-4 py-2 gap-2'}>
				<div className="space-y-2">
					<div className="flex justify-between items-end h-5">
						<Label htmlFor={`${id}-start`}>
							{dict.datagrid.dateStart}:
						</Label>
						<DataViewDateFilterResetTrigger type="start">
							<span className="text-sm text-gray-500 cursor-pointer hover:bg-gray-100 rounded p-0.5">
								<XIcon className="w-3 h-3" />
							</span>
						</DataViewDateFilterResetTrigger>
					</div>
					<DataViewDateFilterInput type={'start'}>
						<Input inputSize={'sm'} placeholder={dict.datagrid.dateStart} type={'date'} id={`${id}-start`} />
					</DataViewDateFilterInput>
				</div>
				<div className="space-y-2">
					<div className="flex justify-between items-end h-5">
						<Label htmlFor={`${id}-end`}>
							{dict.datagrid.dateEnd}:
						</Label>
						<DataViewDateFilterResetTrigger type="end">
							<span className="text-sm text-gray-500 cursor-pointer hover:bg-gray-100 rounded p-0.5">
								<XIcon className="w-3 h-3" />
							</span>
						</DataViewDateFilterResetTrigger>
					</div>
					<DataViewDateFilterInput type={'end'}>
						<Input inputSize={'sm'} placeholder={dict.datagrid.dateEnd} type={'date'} id={`${id}-end`} />
					</DataViewDateFilterInput>
				</div>
			</div>
			<div className="mt-auto p-2 border-t">
				<DataGridNullFilter />
			</div>
		</div>
	)
}
