import { ReactNode, useId } from 'react'
import { DataViewDateFilter, DataViewDateFilterInput, DataViewDateFilterProps, DataViewDateFilterResetTrigger, DataViewNullFilterTrigger, DateRangeFilterArtifacts, useDataViewFilter, useDataViewFilterName } from '@contember/react-dataview'
import { Component } from '@contember/interface'
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover'
import { DataGridActiveFilterUI, DataGridFilterSelectTriggerUI, DataGridSingleFilterUI } from '../ui'
import { Input } from '../../ui/input'
import { formatDate } from '../../formatting/formatting'
import { dict } from '../../dict'
import { DataGridNullFilter } from './common'
import { DataGridFilterMobileHiding } from './mobile'
import { Button } from '../../ui/button'
import { Label } from '../../ui/label'
import { XIcon } from 'lucide-react'
import { DataViewFieldLabel } from '../labels'
import { cn } from '../../utils'

/**
* Props for {@link DataGridDateFilter}.
*/
export type DataGridPredefinedDateRange = {
	/**
	 * Start date in ISO format
	 */
	start: string
	/**
	 * End date in ISO format
	 */
	end: string
	/**
	 * Label for the range
	 */
	label: ReactNode
}

/**
 * Props for {@link DataGridDateFilter}.
 */
export interface DataGridDateFilterProps extends Omit<DataViewDateFilterProps, 'children'> {
	label: ReactNode
	ranges?: DataGridPredefinedDateRange[]
}

/**
 * Props {@link DataGridDateFilterProps}
 *
 * `DataGridDateFilter` is a date filter component designed for use within a `DataGrid`.
 * It provides a default UI for selecting date ranges and filtering data accordingly.
 *
 * #### Example: Basic usage
 * ```tsx
 * <DataGridDateFilter field="createdAt" label="Created at" />
 * ```
 *
 * #### Example: With predefined date ranges
 * ```tsx
 * <DataGridDateFilter field="updatedAt" ranges={[{ label: 'Last 7 days', value: '7d' }]} />
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
 * Creates a predefined date range object for use in a `DataGrid` filter.
 *
 * - Computes start and end dates based on the given day offsets.
 * - Returns the range in `YYYY-MM-DD` format.
 *
 * @param label - The displaydd label for the predefined range.
 * @param dayDeltaStart - The number of days from today for the start date (negative for past dates).
 * @param dayDeltaEnd - The number of days from today for the end date.
 * @returns A `DataGridPredefinedDateRange` object with formatted start and end dates.
 *
 * #### Example: Last 7 days
 * ```tsx
 * const lastWeek = createDataGridDateRange('Last 7 days', -7, 0)
 * console.log(lastWeek)
 * // { label: 'Last 7 days', start: '2025-01-01', end: '2025-01-07' }
 * ```
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

const defaultRanges = [createDataGridDateRange(dict.datagrid.today, 0, 0)]

type DataGridDateFilterSelectProps = {
	label?: ReactNode
	ranges?: DataGridPredefinedDateRange[]
}

const DataGridDateFilterSelect = ({ label, ranges = defaultRanges }: DataGridDateFilterSelectProps) => (
	<Popover>
		<PopoverTrigger asChild>
			<DataGridFilterSelectTriggerUI>{label}</DataGridFilterSelectTriggerUI>
		</PopoverTrigger>
		<PopoverContent className="p-0">
			<div className="flex">
				{ranges?.length > 0 && <div className="flex flex-col gap-2 bg-gray-50 p-4 border-r border-gray-200">
					{ranges.map(({ start, end, label }) => (
						<DataGridRangeFilter start={start} end={end} label={label} key={`${start}-${end}`} />
					))}
				</div>}
				<DataGridDateFilterControls layout={ranges?.length > 0 ? 'column' : 'row'} />
			</div>
		</PopoverContent>
	</Popover>
)


const DataGridRangeFilter = ({ start, end, label }: DataGridPredefinedDateRange) => {
	const name = useDataViewFilterName()
	const [filter, setFilter] = useDataViewFilter<DateRangeFilterArtifacts>(name)
	const isActive = filter?.start === start && filter?.end === end

	return (
		<Button
			variant="outline"
			size="sm"
			className={cn(isActive && 'shadow-inner bg-gray-100')}
			onClick={() => {
				setFilter({
					start,
					end,
				})
			}}
		>
			{label}
		</Button>
	)
}

/**
 * @internal
 */
export const DataGridDateFilterControls = ({ layout }: { layout?: 'row' | 'column' }) => {
	const id = useId()

	return (
		<div className="flex flex-col">
			<div className={layout === 'row' ? 'flex gap-4 px-4 py-2' : 'flex flex-col px-4 py-2 gap-2'}>
				<div className="space-y-2">
					<div className="flex justify-between items-end h-5">
						<Label htmlFor={`${id}-start`}>
							{dict.datagrid.dateStart}:
						</Label>
						<DataViewDateFilterResetTrigger type="start">
							<span className="text-sm text-gray-500 cursor-pointer hover:bg-gray-100 rounded-sm p-0.5"><XIcon
								className="w-3 h-3" /></span>
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
							<span className="text-sm text-gray-500 cursor-pointer hover:bg-gray-100 rounded-sm p-0.5"><XIcon
								className="w-3 h-3" /></span>
						</DataViewDateFilterResetTrigger>
					</div>
					<DataViewDateFilterInput type={'end'}>
						<Input inputSize={'sm'} placeholder={dict.datagrid.dateEnd} type={'date'} id={`${id}-end`} />
					</DataViewDateFilterInput>
				</div>
			</div>
			<div className="mt-auto p-2 border-t border-gray-200">
				<DataGridNullFilter />
			</div>
		</div>
	)
}
