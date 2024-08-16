import * as React from 'react'
import { ReactNode, useCallback } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../ui/tooltip'
import { DataViewEnumFilter, DataViewEnumFilterProps, DataViewEnumFilterTrigger, DataViewNullFilterTrigger, UseDataViewEnumFilter, useDataViewEnumFilterFactory, useDataViewFilterName } from '@contember/react-dataview'
import { Component } from '@contember/interface'
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover'
import { DataGridActiveFilterUI, DataGridExcludeActionButtonUI, DataGridFilterActionButtonUI, DataGridFilterSelectItemUI, DataGridFilterSelectTriggerUI, DataGridSingleFilterUI } from '../ui'
import { DataGridNullFilter } from './common'
import { dict } from '../../dict'
import { DataGridFilterMobileHiding } from './mobile'

export type DataGridEnumFilterProps =
	& Omit<DataViewEnumFilterProps, 'children'>
	& {
		options: Record<string, ReactNode>
		label?: ReactNode
	}

export const DataGridEnumFilter = Component(({ options, label, ...props }: DataGridEnumFilterProps) =>
	(
		<DataViewEnumFilter {...props}>
			<DataGridFilterMobileHiding>
				<DataGridSingleFilterUI>
					<DataGridEnumFilterSelect options={options} label={label} />
					<DataGridEnumFilterList options={options} />
				</DataGridSingleFilterUI>
			</DataGridFilterMobileHiding>
		</DataViewEnumFilter>
	))

export const DataGridEnumFieldTooltip = ({ children, actions, value, ...props }: Omit<DataViewEnumFilterProps, 'children'> & { children: ReactNode; value: string; actions?: ReactNode }) => (
	<DataViewEnumFilter {...props}>
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					{children}
				</TooltipTrigger>
				<TooltipContent variant={'blurred'}>
					<div className={'flex gap-1'}>
						<DataViewEnumFilterTrigger action={'toggleInclude'} value={value}>
							<DataGridFilterActionButtonUI />
						</DataViewEnumFilterTrigger>
						<DataViewEnumFilterTrigger action={'toggleExclude'} value={value}>
							<DataGridExcludeActionButtonUI />
						</DataViewEnumFilterTrigger>
						{actions}
					</div>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	</DataViewEnumFilter>
)


export const DataGridEnumFilterList = ({ options }: {
	options: Record<string, ReactNode>
}) => (
	<>
		{Object.entries(options).map(([value, label]) => (
			<DataViewEnumFilterTrigger action={'unset'} value={value} key={value}>
				<DataGridActiveFilterUI>
					{label}
				</DataGridActiveFilterUI>
			</DataViewEnumFilterTrigger>
		))}

		<DataViewNullFilterTrigger action={'unset'}>
			<DataGridActiveFilterUI>
				<span className={'italic'}>{dict.datagrid.na}</span>
			</DataGridActiveFilterUI>
		</DataViewNullFilterTrigger>
	</>
)
const DataGridEnumFilterSelectItem = ({ value, children, filterFactory }: {
	value: string
	children: ReactNode
	filterFactory: (value: string) => UseDataViewEnumFilter
}) => {

	const [current, setFilter] = filterFactory(value)
	const include = useCallback(() => setFilter('toggleInclude'), [setFilter])
	const exclude = useCallback(() => setFilter('toggleExclude'), [setFilter])
	const isIncluded = current === 'include'

	const isExcluded = current === 'exclude'
	return (
		<DataGridFilterSelectItemUI onExclude={exclude} onInclude={include} isExcluded={isExcluded} isIncluded={isIncluded}>
			{children}
		</DataGridFilterSelectItemUI>
	)

}
export const DataGridEnumFilterSelect = ({  options, label }: {
	options: Record<string, ReactNode>
	label?: ReactNode
}) => {
	return (
		<Popover>
			<PopoverTrigger asChild>
				<DataGridFilterSelectTriggerUI>{label}</DataGridFilterSelectTriggerUI>
			</PopoverTrigger>
			<PopoverContent className="p-2">
				<DataGridEnumFilterControls options={options} />
			</PopoverContent>
		</Popover>
	)
}

export const DataGridEnumFilterControls = ({ options }: {
	options: Record<string, ReactNode>
}) => {
	const filterFactory = useDataViewEnumFilterFactory(useDataViewFilterName())
	return (
		<div className={'relative flex flex-col gap-2'}>
			{Object.entries(options).map(([value, label]) => (
				<DataGridEnumFilterSelectItem value={value} key={value} filterFactory={filterFactory}>
					{label}
				</DataGridEnumFilterSelectItem>
			))}
			<DataGridNullFilter />
		</div>
	)
}
