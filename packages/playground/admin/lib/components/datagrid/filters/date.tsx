import * as React from 'react'
import { ReactNode } from 'react'
import { createDateFilter, DataViewDateFilterInput, DataViewDateFilterResetTrigger, DataViewFilter, DataViewNullFilterTrigger, DateRangeFilterArtifacts, useDataViewFilter } from '@contember/react-dataview'
import { Component, SugaredRelativeSingleField } from '@contember/interface'
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover'
import { DataGridActiveFilterUI, DataGridFilterSelectTriggerUI, DataGridSingleFilterUI } from '../ui'
import { Input } from '../../ui/input'
import { formatDate } from '../../../utils/formatting'
import { dict } from '../../../dict'
import { DataGridNullFilter } from './common'
import { getFilterName } from './utils'

export type DataGridDateFilterProps = {
	field: SugaredRelativeSingleField['field']
	name?: string
	label: ReactNode
}

export const DataGridDateFilter = Component(({ name: nameIn, field, label }: DataGridDateFilterProps) => {
	const name = getFilterName(nameIn, field)
	return (
		<DataGridSingleFilterUI>
			<DataGridDateFilterSelect name={name} label={label} />
			<DataGridDateFilterList name={name} />
		</DataGridSingleFilterUI>
	)
}, ({ name, field }) => {
	return <DataViewFilter name={getFilterName(name, field)} filterHandler={createDateFilter(field)} />
})

const DataGridDateFilterRange = ({ name }: { name: string }) => {
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


const DataGridDateFilterList = ({ name }: {
	name: string
}) => (
	<>
		<DataViewDateFilterResetTrigger name={name}>
			<DataGridActiveFilterUI>
				<DataGridDateFilterRange name={name} />
			</DataGridActiveFilterUI>
		</DataViewDateFilterResetTrigger>

		<DataViewNullFilterTrigger name={name} action={'unset'}>
			<DataGridActiveFilterUI>
				<span className={'italic'}>{dict.datagrid.na}</span>
			</DataGridActiveFilterUI>
		</DataViewNullFilterTrigger>
	</>
)


const DataGridDateFilterSelect = ({ name, label }: {
	name: string
	label?: ReactNode
}) => (
	<Popover>
		<PopoverTrigger asChild>
			<DataGridFilterSelectTriggerUI>{label}</DataGridFilterSelectTriggerUI>
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
				<DataGridNullFilter name={name} />
			</div>
		</PopoverContent>
	</Popover>
)
