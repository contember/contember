import * as React from 'react'
import { ReactNode } from 'react'
import { DataViewDateFilter, DataViewDateFilterInput, DataViewDateFilterProps, DataViewDateFilterResetTrigger, DataViewNullFilterTrigger, DateRangeFilterArtifacts, useDataViewFilter, useDataViewFilterName } from '@contember/react-dataview'
import { Component } from '@contember/interface'
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover'
import { DataGridActiveFilterUI, DataGridFilterSelectTriggerUI, DataGridSingleFilterUI } from '../ui'
import { Input } from '../../ui/input'
import { formatDate } from '../../../utils/formatting'
import { dict } from '../../../dict'
import { DataGridNullFilter } from './common'

export type DataGridDateFilterProps =
	& Omit<DataViewDateFilterProps, 'children'>
	& {
		label: ReactNode
	}

export const DataGridDateFilter = Component(({ label, ...props }: DataGridDateFilterProps) => (
	<DataViewDateFilter {...props}>
		<DataGridSingleFilterUI>
			<DataGridDateFilterSelect label={label} />
			<DataGridDateFilterList />
		</DataGridSingleFilterUI>
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


const DataGridDateFilterSelect = ({ label }: {
	label?: ReactNode
}) => (
	<Popover>
		<PopoverTrigger asChild>
			<DataGridFilterSelectTriggerUI>{label}</DataGridFilterSelectTriggerUI>
		</PopoverTrigger>
		<PopoverContent>
			<div className={'relative flex flex-col gap-4'}>
				<div className={'flex justify-center items-center'}>
					<DataViewDateFilterInput type={'start'}>
						<Input inputSize={'sm'} placeholder={dict.datagrid.dateStart} type={'date'} />
					</DataViewDateFilterInput>
					<span className={'mx-4 font-bold '}>
						–
					</span>
					<DataViewDateFilterInput type={'end'}>
						<Input inputSize={'sm'} placeholder={dict.datagrid.dateEnd} type={'date'} />
					</DataViewDateFilterInput>
				</div>
				<DataGridNullFilter />
			</div>
		</PopoverContent>
	</Popover>
)
