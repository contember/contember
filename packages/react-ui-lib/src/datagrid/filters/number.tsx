import * as React from 'react'
import { ReactNode } from 'react'
import {
	DataViewNullFilterTrigger,
	DataViewNumberFilter,
	DataViewNumberFilterInput,
	DataViewNumberFilterProps,
	DataViewNumberFilterResetTrigger,
	NumberRangeFilterArtifacts,
	useDataViewFilter,
	useDataViewFilterName,
} from '@contember/react-dataview'
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover'
import { DataGridActiveFilterUI, DataGridFilterSelectTriggerUI, DataGridSingleFilterUI } from '../ui'
import { DataGridNullFilter } from './common'
import { Input } from '../../ui/input'
import { formatNumber } from '../../formatting'
import { dict } from '../../dict'
import { Component } from '@contember/interface'
import { DataGridFilterMobileHiding } from './mobile'
import { DataViewFieldLabel } from '../labels'

/**
 * Props for {@link DataGridNumberFilter}.
 */
export type DataGridNumberFilterProps =
	& Omit<DataViewNumberFilterProps, 'children'>
	& {
		label: ReactNode
	}
/**
 * Number filter for DataGrid with default UI.
 *
 * ## Props {@link DataGridNumberFilterProps}
 * field, label, ?name
 *
 * ## Example
 * ```tsx
 * <DataGridNumberFilter field={'views'} label="Views" />
 * ```
 */
export const DataGridNumberFilter = Component(({ label, ...props }: DataGridNumberFilterProps) => (
	<DataViewNumberFilter {...props}>
		<DataGridFilterMobileHiding>
			<DataGridSingleFilterUI>
				<DataGridNumberFilterSelect label={label ?? <DataViewFieldLabel field={props.field} />} />
				<DataGridNumberFilterList />
			</DataGridSingleFilterUI>
		</DataGridFilterMobileHiding>
	</DataViewNumberFilter>
))


const DataGridNumberFilterRange = () => {
	const [artifact] = useDataViewFilter<NumberRangeFilterArtifacts>(useDataViewFilterName())
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


const DataGridNumberFilterList = () => (
	<>
		<DataViewNumberFilterResetTrigger>
			<DataGridActiveFilterUI>
				<DataGridNumberFilterRange />
			</DataGridActiveFilterUI>
		</DataViewNumberFilterResetTrigger>

		<DataViewNullFilterTrigger action={'unset'}>
			<DataGridActiveFilterUI>
				<span className={'italic'}>{dict.datagrid.na}</span>
			</DataGridActiveFilterUI>
		</DataViewNullFilterTrigger>
	</>
)


const DataGridNumberFilterSelect = ({ label }: {
	label?: ReactNode
}) => (
	<Popover>
		<PopoverTrigger asChild>
			<DataGridFilterSelectTriggerUI>{label}</DataGridFilterSelectTriggerUI>
		</PopoverTrigger>
		<PopoverContent>
			<DataGridNumberFilterControls />
		</PopoverContent>
	</Popover>
)

/**
 * @internal
 */
export const DataGridNumberFilterControls = () => {
	return (
		<div className={'flex flex-col gap-4'}>
			<div className={'flex justify-center items-center'}>
				<DataViewNumberFilterInput type={'from'}>
					<Input className={''} inputSize={'sm'} placeholder={dict.datagrid.numberFrom} type={'number'} />
				</DataViewNumberFilterInput>
				<span className={'mx-4 font-bold '}>
					–
				</span>
				<DataViewNumberFilterInput type={'to'}>
					<Input className={''} inputSize={'sm'} placeholder={dict.datagrid.numberTo} type={'number'} />
				</DataViewNumberFilterInput>
			</div>

			<DataGridNullFilter />
		</div>
	)
}
