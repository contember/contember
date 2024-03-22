import * as React from 'react'
import { ReactNode } from 'react'
import { createNumberFilter, DataViewFilter, DataViewNullFilterTrigger, DataViewNumberFilterInput, DataViewNumberFilterResetTrigger, NumberRangeFilterArtifacts, useDataViewFilter } from '@contember/react-dataview'
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover'
import { DataGridActiveFilterUI, DataGridFilterSelectTriggerUI, DataGridSingleFilterUI } from '../ui'
import { DataGridNullFilter } from './common'
import { Input } from '../../ui/input'
import { formatNumber } from '../../../utils/formatting'
import { dict } from '../../../dict'
import { Component, SugaredRelativeSingleField } from '@contember/interface'
import { getFilterName } from './utils'

export type DataGridNumberFilterProps = {
	field: SugaredRelativeSingleField['field']
	name?: string
	label: ReactNode
}

export const DataGridNumberFilter = Component(({ name: nameIn, field, label }: DataGridNumberFilterProps) => {
	const name = getFilterName(nameIn, field)
	return (
		<DataGridSingleFilterUI>
			<DataGridNumberFilterSelect name={name} label={label} />
			<DataGridNumberFilterList name={name} />
		</DataGridSingleFilterUI>
	)
}, ({ name, field }) => {
	return <DataViewFilter name={getFilterName(name, field)} filterHandler={createNumberFilter(field)} />
})


const DataGridNumberFilterRange = ({ name }: {
	name: string
}) => {
	const [artifact] = useDataViewFilter<NumberRangeFilterArtifacts>(name)
	if (!artifact) {
		return null
	}
	if (artifact.from !== undefined && artifact.to !== undefined) {
		return `${formatNumber(artifact.from)} – ${formatNumber(artifact.to)}`
	}
	if (artifact.from !== undefined) {
		return `≥ ${formatNumber(artifact.from)}`
	}
	if (artifact.to !== undefined) {
		return `≤ ${formatNumber(artifact.to)}`
	}
	return null
}


export const DataGridNumberFilterList = ({ name }: {
	name: string
}) => (
	<>
		<DataViewNumberFilterResetTrigger name={name}>
			<DataGridActiveFilterUI>
				<DataGridNumberFilterRange name={name} />
			</DataGridActiveFilterUI>
		</DataViewNumberFilterResetTrigger>

		<DataViewNullFilterTrigger name={name} action={'unset'}>
			<DataGridActiveFilterUI>
				<span className={'italic'}>{dict.datagrid.na}</span>
			</DataGridActiveFilterUI>
		</DataViewNullFilterTrigger>
	</>
)


export const DataGridNumberFilterSelect = ({ name, label }: {
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
					<DataViewNumberFilterInput name={name} type={'from'}>
						<Input className={''} inputSize={'sm'} placeholder={dict.datagrid.numberFrom} type={'number'} />
					</DataViewNumberFilterInput>
					<span className={'mx-4 font-bold '}>
						–
					</span>
					<DataViewNumberFilterInput name={name} type={'to'}>
						<Input className={''} inputSize={'sm'} placeholder={dict.datagrid.numberTo} type={'number'} />
					</DataViewNumberFilterInput>
				</div>

				<DataGridNullFilter name={name} />
			</div>
		</PopoverContent>
	</Popover>
)
