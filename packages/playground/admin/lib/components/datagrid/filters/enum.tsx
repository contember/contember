import * as React from 'react'
import { ReactEventHandler, ReactNode, useCallback } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../ui/tooltip'
import { Button } from '../../ui/button'
import {
	DataViewEnumFilterTrigger,
	DataViewNullFilterTrigger,
	EnumFilterArtifacts,
	UseDataViewEnumFilter,
	useDataViewEnumFilterFactory,
	useDataViewFilter,
} from '@contember/react-dataview'
import { Component } from '@contember/interface'
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover'
import {
	DataViewActiveFilterUI,
	DataViewExcludeActionButtonUI,
	DataViewFilterActionButtonUI,
	DataViewFilterSelectItemUI,
	DataViewFilterSelectTriggerUI,
	DataViewSingleFilterUI,
} from '../ui'
import { DataViewNullFilter } from './common'
import { dict } from '../../../../lib/dict'

export const DataViewEnumFieldTooltip = ({ filter, children, actions, value }: { filter: string, children: ReactNode, value: string, actions?: ReactNode }) => (
	<TooltipProvider>
		<Tooltip>
			<TooltipTrigger asChild>
				<Button variant={'ghost'} size={'sm'}>
					{children}
				</Button>
			</TooltipTrigger>
			<TooltipContent variant={'blurred'}>
				<div className={'flex gap-1'}>
					<DataViewEnumFilterTrigger name={filter} action={'toggleInclude'} value={value}>
						<DataViewFilterActionButtonUI />
					</DataViewEnumFilterTrigger>
					<DataViewEnumFilterTrigger name={filter} action={'toggleExclude'} value={value}>
						<DataViewExcludeActionButtonUI />
					</DataViewEnumFilterTrigger>
					{actions}
				</div>
			</TooltipContent>
		</Tooltip>
	</TooltipProvider>
)

const DataViewEnumFilterList = ({ name, options }: {
	name: string
	options: Record<string, ReactNode>
}) => (
	<>
		{Object.entries(options).map(([value, label]) => (
			<DataViewEnumFilterTrigger name={name} action={'unset'} value={value} key={value}>
				<DataViewActiveFilterUI>
					{label}
				</DataViewActiveFilterUI>
			</DataViewEnumFilterTrigger>
		))}

		<DataViewNullFilterTrigger name={name} action={'unset'}>
			<DataViewActiveFilterUI>
				<span className={'italic'}>{dict.datagrid.na}</span>
			</DataViewActiveFilterUI>
		</DataViewNullFilterTrigger>
	</>
)


const DataViewEnumFilterSelectItem = ({ value, children, filterFactory }: {
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
		<DataViewFilterSelectItemUI onExclude={exclude} onInclude={include} isExcluded={isExcluded} isIncluded={isIncluded}>
			{children}
		</DataViewFilterSelectItemUI>
	)
}

const DataViewEnumFilterSelect = ({ name, options, label }: {
	name: string
	options: Record<string, ReactNode>
	label?: ReactNode
}) => {
	const filterFactory = useDataViewEnumFilterFactory(name)

	return (
		<Popover>
			<PopoverTrigger asChild>
				<DataViewFilterSelectTriggerUI>{label}</DataViewFilterSelectTriggerUI>
			</PopoverTrigger>
			<PopoverContent className="p-2">
				<div className={'relative flex flex-col gap-2'}>
					{Object.entries(options).map(([value, label]) => (
						<DataViewEnumFilterSelectItem value={value} key={value} filterFactory={filterFactory}>
							{label}
						</DataViewEnumFilterSelectItem>
					))}
					<DataViewNullFilter name={name} />
				</div>
			</PopoverContent>
		</Popover>
	)
}


export const DefaultDataViewEnumFilter = Component(({ name, options, label }: {
	name: string
	options: Record<string, ReactNode>
	label: ReactNode
}) => (
	<DataViewSingleFilterUI>
		<DataViewEnumFilterSelect name={name} options={options} label={label} />
		<DataViewEnumFilterList name={name} options={options} />
	</DataViewSingleFilterUI>
), () => null)
