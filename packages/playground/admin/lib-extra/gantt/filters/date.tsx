import { DataGridFilterMobileHiding, DataGridSingleFilterUI } from '@app/lib/datagrid'
import { dict } from '@app/lib/dict'
import { Button } from '@app/lib/ui/button'
import { Input } from '@app/lib/ui/input'
import { Component } from '@contember/interface'
import {
	DataViewDateFilter,
	DataViewDateFilterProps,
	DateRangeFilterArtifacts,
	useDataViewFilter,
	useDataViewFilterName,
} from '@contember/react-dataview'
import { Slot } from '@radix-ui/react-slot'
import * as React from 'react'
import { ChangeEvent, ComponentType, ReactNode, useCallback, useId } from 'react'

export type DataGridDateFilterProps = Omit<DataViewDateFilterProps, 'children'> & {
	label: ReactNode
	ranges?: DataGridPredefinedDateRange[]
}

export const GanttChartDateFilter = Component(({ label, ranges, ...props }: DataGridDateFilterProps) => (
	<DataViewDateFilter {...props}>
		<DataGridFilterMobileHiding>
			<DataGridSingleFilterUI>
				<DataGridDateFilterSelect label={label} ranges={ranges} />
			</DataGridSingleFilterUI>
		</DataGridFilterMobileHiding>
	</DataViewDateFilter>
))

export const createDataGridDateRange = (label: ReactNode, dayDeltaStart: number, dayDeltaEnd: number): DataGridPredefinedDateRange => {
	const start = new Date(new Date().setDate(new Date().getDate() + dayDeltaStart))
	const end = new Date(new Date().setDate(new Date().getDate() + dayDeltaEnd))
	return {
		label,
		start: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`,
		end: `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}`,
	}
}

const defaultRanges = [
	createDataGridDateRange(dict.datagrid.yesterday, -1, -1),
	createDataGridDateRange(dict.datagrid.today, 0, 0),
	createDataGridDateRange(dict.datagrid.tomorrow, 1, 1),
]

const DataGridDateFilterSelect = ({
	label,
	ranges = defaultRanges,
}: {
	label?: ReactNode
	ranges?: DataGridPredefinedDateRange[]
}) => {
	return (
		<div className="flex items-center gap-2 py-0.5">
			<span className={'text-xs font-medium'}>
				{label}
				{':'}
			</span>
			<div className="flex items-center gap-4">
				<DataGridDateFilterControls />
				{ranges?.length > 0 && (
					<div className="flex gap-2 bg-gray-50 border-l pl-4">
						{ranges.map(({ start, end, label }) => (
							<DataGridRangeFilter start={start} end={end} label={label} key={`${start}-${end}`} />
						))}
					</div>
				)}
			</div>
		</div>
	)
}

export type DataGridPredefinedDateRange = { start: string; end: string; label: ReactNode }
const DataGridRangeFilter = ({ start, end, label }: DataGridPredefinedDateRange) => {
	const name = useDataViewFilterName()
	const [filter, setFilter] = useDataViewFilter<DateRangeFilterArtifacts>(name)
	const isActive = filter?.start === start
	return (
		<Button
			variant="outline"
			size="xs"
			className={isActive ? 'shadow-inner bg-gray-100' : ''}
			onClick={() => {
				setFilter({
					start,
					end: start,
				})
			}}
		>
			{label}
		</Button>
	)
}

const SlotInput = Slot as ComponentType<React.InputHTMLAttributes<HTMLInputElement>>

const useDataViewDateFilterInput = () => {
	const [state, setFilter] = useDataViewFilter<DateRangeFilterArtifacts>(useDataViewFilterName())
	const onChange = useCallback(
		(e: ChangeEvent<HTMLInputElement>) => {
			setFilter(it => ({
				...it,
				start: e.target.value?.match(/\d{4}-\d{2}-\d{2}/) ? e.target.value : undefined,
				end: e.target.value?.match(/\d{4}-\d{2}-\d{2}/) ? e.target.value : undefined,
			}))
		},
		[setFilter],
	)

	// Set the date to today if it is not set
	const today = new Date().toISOString().split('T')[0]
	if (!state?.start) {
		setFilter(it => ({
			...it,
			start: today,
			end: today,
		}))
	}

	return {
		value: state?.start ?? '',
		onChange,
	}
}

export const DataGridDateFilterControls = () => {
	const id = useId()
	return (
		<SlotInput {...useDataViewDateFilterInput()}>
			<Input inputSize={'sm'} placeholder={dict.datagrid.dateStart} type={'date'} id={`${id}-start`} className="h-6" />
		</SlotInput>
	)
}
