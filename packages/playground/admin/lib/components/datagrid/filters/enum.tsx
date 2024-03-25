import * as React from 'react'
import { ReactNode, useCallback } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../ui/tooltip'
import { Button } from '../../ui/button'
import { createEnumFilter, DataViewEnumFilterTrigger, DataViewFilter, DataViewNullFilterTrigger, UseDataViewEnumFilter, useDataViewEnumFilterFactory } from '@contember/react-dataview'
import { Component, SugaredRelativeSingleField } from '@contember/interface'
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover'
import { DataGridActiveFilterUI, DataGridExcludeActionButtonUI, DataGridFilterActionButtonUI, DataGridFilterSelectItemUI, DataGridFilterSelectTriggerUI, DataGridSingleFilterUI } from '../ui'
import { DataGridNullFilter } from './common'
import { dict } from '../../../dict'
import { getFilterName } from './utils'

export type DataGridEnumFilterProps = {
	field: SugaredRelativeSingleField['field']
	name?: string
	options: Record<string, ReactNode>
	label: ReactNode
}
export const DataGridEnumFilter = Component(({ name: nameIn, field, options, label }: DataGridEnumFilterProps) => {
	const name = getFilterName(nameIn, field)
	return (
		<DataGridSingleFilterUI>
			<DataGridEnumFilterSelect name={name} options={options} label={label} />
			<DataGridEnumFilterList name={name} options={options} />
		</DataGridSingleFilterUI>
	)
}, ({ name, field }) => {
	return <DataViewFilter name={getFilterName(name, field)} filterHandler={createEnumFilter(field)} />
})

export const DataGridEnumFieldTooltip = ({ filter, children, actions, value }: { filter: string, children: ReactNode, value: string, actions?: ReactNode }) => (
	<TooltipProvider>
		<Tooltip>
			<TooltipTrigger asChild>
				{children}
			</TooltipTrigger>
			<TooltipContent variant={'blurred'}>
				<div className={'flex gap-1'}>
					<DataViewEnumFilterTrigger name={filter} action={'toggleInclude'} value={value}>
						<DataGridFilterActionButtonUI />
					</DataViewEnumFilterTrigger>
					<DataViewEnumFilterTrigger name={filter} action={'toggleExclude'} value={value}>
						<DataGridExcludeActionButtonUI />
					</DataViewEnumFilterTrigger>
					{actions}
				</div>
			</TooltipContent>
		</Tooltip>
	</TooltipProvider>
)


const DataGridEnumFilterList = ({ name, options }: {
	name: string
	options: Record<string, ReactNode>
}) => (
	<>
		{Object.entries(options).map(([value, label]) => (
			<DataViewEnumFilterTrigger name={name} action={'unset'} value={value} key={value}>
				<DataGridActiveFilterUI>
					{label}
				</DataGridActiveFilterUI>
			</DataViewEnumFilterTrigger>
		))}

		<DataViewNullFilterTrigger name={name} action={'unset'}>
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

	const isExcluded = current == 'exclude'
	return (
		<DataGridFilterSelectItemUI onExclude={exclude} onInclude={include} isExcluded={isExcluded} isIncluded={isIncluded}>
			{children}
		</DataGridFilterSelectItemUI>
	)

}
const DataGridEnumFilterSelect = ({ name, options, label }: {
	name: string
	options: Record<string, ReactNode>
	label?: ReactNode
}) => {

	const filterFactory = useDataViewEnumFilterFactory(name)
	return (
		<Popover>
			<PopoverTrigger asChild>
				<DataGridFilterSelectTriggerUI>{label}</DataGridFilterSelectTriggerUI>
			</PopoverTrigger>
			<PopoverContent className="p-2">
				<div className={'relative flex flex-col gap-2'}>
					{Object.entries(options).map(([value, label]) => (
						<DataGridEnumFilterSelectItem value={value} key={value} filterFactory={filterFactory}>
							{label}
						</DataGridEnumFilterSelectItem>
					))}
					<DataGridNullFilter name={name} />
				</div>
			</PopoverContent>
		</Popover>
	)
}
