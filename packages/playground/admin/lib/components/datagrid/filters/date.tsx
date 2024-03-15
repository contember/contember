import * as React from 'react'
import { ReactNode } from 'react'
import {
	DataViewDateFilterInput,
	DataViewDateFilterResetTrigger,
	DataViewNullFilterTrigger,
	DateRangeFilterArtifacts,
	useDataViewFilter,
} from '@contember/react-dataview'
import { Component } from '@contember/interface'
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover'
import { DataViewActiveFilterUI, DataViewFilterSelectTriggerUI, DataViewSingleFilterUI } from '../ui'
import { DataViewNullFilter } from './common'
import { Input } from '../../ui/input'
import { formatDate } from '../../../utils/formatting'
import { dict } from '../../../dict'

const DataViewDateFilterRange = ({ name }: { name: string }) => {
	const [artifact] = useDataViewFilter<DateRangeFilterArtifacts>(name)
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

const DataViewDateFilterList = ({ name }: {
	name: string
}) => (
	<>
		<DataViewDateFilterResetTrigger name={name}>
			<DataViewActiveFilterUI>
				<DataViewDateFilterRange name={name} />
			</DataViewActiveFilterUI>
		</DataViewDateFilterResetTrigger>

		<DataViewNullFilterTrigger name={name} action={'unset'}>
			<DataViewActiveFilterUI>
				<span className={'italic'}>{dict.datagrid.na}</span>
			</DataViewActiveFilterUI>
		</DataViewNullFilterTrigger>
	</>
)


const DataViewDateFilterSelect = ({ name, label }: {
	name: string
	label?: ReactNode
}) => (
	<Popover>
		<PopoverTrigger asChild>
			<DataViewFilterSelectTriggerUI>{label}</DataViewFilterSelectTriggerUI>
		</PopoverTrigger>
		<PopoverContent>
			<div className={'relative flex flex-col gap-4'}>
				<div className={'flex justify-center items-center'}>
					<DataViewDateFilterInput name={name} type={'start'}>
						<Input className={''} inputSize={'sm'} placeholder={dict.datagrid.dateStart} type={'date'} />
					</DataViewDateFilterInput>
					<span className={'mx-4 font-bold '}>
						–
					</span>
					<DataViewDateFilterInput name={name} type={'end'}>
						<Input className={''} inputSize={'sm'} placeholder={dict.datagrid.dateEnd} type={'date'} />
					</DataViewDateFilterInput>
				</div>
				<DataViewNullFilter name={name} />
			</div>
		</PopoverContent>
	</Popover>
)


export const DefaultDataViewDateFilter = Component(({ name, label }: {
	name: string
	label: ReactNode
}) => {
	return (
		<DataViewSingleFilterUI>
			<DataViewDateFilterSelect name={name} label={label} />
			<DataViewDateFilterList name={name} />
		</DataViewSingleFilterUI>
	)
}, () => null)
