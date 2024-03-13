import * as React from 'react'
import { forwardRef, ReactNode, useCallback } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../ui/tooltip'
import { Button } from '../../ui/button'
import { createCoalesceFilter, DataView, DataViewNullFilterTrigger, DataViewRelationFilterList, DataViewRelationFilterTrigger, useDataViewRelationFilterFactory, UseDataViewRelationFilterResult } from '@contember/react-dataview'
import { Component, EntityId, SugarableQualifiedEntityList, SugaredQualifiedEntityList, useEntity } from '@contember/interface'
import { Popover, PopoverTrigger } from '../../ui/popover'
import { DataViewActiveFilterUI, DataViewExcludeActionButtonUI, DataViewFilterActionButtonUI, DataViewFilterSelectItemUI, DataViewFilterSelectTriggerUI, DataViewSingleFilterUI } from '../ui'
import { DataViewNullFilter } from './common'
import { SelectDefaultFilter, SelectListInner, SelectPopoverContent } from '../../select'
import { dict } from '../../../dict'
import { SelectFilterFieldProps } from '@contember/react-select'

export const DataViewRelationFieldTooltip = ({ filter, children, actions }: { filter: string, children: ReactNode, actions?: ReactNode }) => (
	<TooltipProvider>
		<Tooltip>
			<TooltipTrigger asChild>
				<Button variant={'ghost'} size={'sm'}>
					{children}
				</Button>
			</TooltipTrigger>
			<TooltipContent variant={'blurred'}>
				<div className={'flex gap-1'}>
					<DataViewRelationFilterTrigger name={filter} action={'toggleInclude'}>
						<DataViewFilterActionButtonUI />
					</DataViewRelationFilterTrigger>
					<DataViewRelationFilterTrigger name={filter} action={'toggleExclude'}>
						<DataViewExcludeActionButtonUI />
					</DataViewRelationFilterTrigger>
					{actions}
				</div>
			</TooltipContent>
		</Tooltip>
	</TooltipProvider>
)

const DataViewRelationFilteredItemsList = ({ name, children, options }: {
	name: string
	options: SugaredQualifiedEntityList['entities']
	children: ReactNode
}) => (
	<>
		<DataViewRelationFilterList name={name} options={options}>
			<DataViewRelationFilterTrigger name={name} action={'unset'}>
				<DataViewActiveFilterUI>
					{children}
				</DataViewActiveFilterUI>
			</DataViewRelationFilterTrigger>
		</DataViewRelationFilterList>
		<DataViewNullFilterTrigger name={name} action={'unset'}>
			<DataViewActiveFilterUI>
				<span className={'italic'}>{dict.datagrid.na}</span>
			</DataViewActiveFilterUI>
		</DataViewNullFilterTrigger>
	</>
)

const DataViewRelationFilterSelectItem = forwardRef<HTMLButtonElement, {
	children: ReactNode
	filterFactory:(value: EntityId) => UseDataViewRelationFilterResult
}>(({ children, filterFactory, ...props }, ref) => {
	const entity = useEntity()
	const [current, setFilter] = filterFactory(entity.id)

	const include = useCallback(() => setFilter('toggleInclude'), [setFilter])
	const exclude = useCallback(() => setFilter('toggleExclude'), [setFilter])

	const isIncluded = current === 'include'
	const isExcluded = current == 'exclude'

	return (
		<DataViewFilterSelectItemUI ref={ref} onExclude={exclude} onInclude={include} isExcluded={isExcluded} isIncluded={isIncluded} {...props}>
			{children}
		</DataViewFilterSelectItemUI>
	)
})


const DataViewRelationFilterSelect = ({ name, children, options, filterField, label }: SelectFilterFieldProps & {
	name: string
	options: string | SugarableQualifiedEntityList
	children: ReactNode
	label?: ReactNode
}) => {
	const filter = filterField ? { query: createCoalesceFilter(Array.isArray(filterField) ? filterField : [filterField]) } : undefined
	let filterFactory = useDataViewRelationFilterFactory(name)
	return (
		<Popover>
			<PopoverTrigger asChild>
				<DataViewFilterSelectTriggerUI>
					{label}
				</DataViewFilterSelectTriggerUI>
			</PopoverTrigger>
			<SelectPopoverContent>
				<DataView filterTypes={filter} entities={options} onSelectHighlighted={it => {
							const [, set] = filterFactory(it.id)
							set('toggleInclude')
				}}>
					<SelectListInner filterToolbar={<SelectDefaultFilter />}>
						<DataViewRelationFilterSelectItem filterFactory={filterFactory}>
							{children}
						</DataViewRelationFilterSelectItem>
					</SelectListInner>
				</DataView>
				<div>
					<DataViewNullFilter name={name} />
				</div>
			</SelectPopoverContent>
		</Popover>
	)
}


export const DefaultDataViewRelationFilter = Component(({ name, options, children, label, filterField }: {
	name: string
	options: SugaredQualifiedEntityList['entities']
	children: ReactNode
	label: ReactNode
	filterField?: string
}) => {
	return (
		<DataViewSingleFilterUI>
			<DataViewRelationFilterSelect name={name} options={options} label={label} filterField={filterField}>
				{children}
			</DataViewRelationFilterSelect>
			<DataViewRelationFilteredItemsList name={name} options={options}>
				{children}
			</DataViewRelationFilteredItemsList>
		</DataViewSingleFilterUI>
	)
}, () => null)
