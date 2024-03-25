import * as React from 'react'
import { forwardRef, ReactNode, useCallback } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../ui/tooltip'
import {
	createHasManyFilter,
	createHasOneFilter, createUnionTextFilter,
	DataView,
	DataViewFilter,
	DataViewNullFilterTrigger,
	DataViewRelationFilterList,
	DataViewRelationFilterTrigger,
	useDataViewRelationFilterFactory,
	UseDataViewRelationFilterResult,
} from '@contember/react-dataview'
import { Component, EntityId, SugarableQualifiedEntityList, SugaredQualifiedEntityList, SugaredRelativeEntityList, SugaredRelativeSingleEntity, useEntity } from '@contember/interface'
import { Popover, PopoverTrigger } from '../../ui/popover'
import { DataGridActiveFilterUI, DataGridExcludeActionButtonUI, DataGridFilterActionButtonUI, DataGridFilterSelectItemUI, DataGridFilterSelectTriggerUI, DataGridSingleFilterUI } from '../ui'
import { DataGridNullFilter } from './common'
import { SelectDefaultFilter, SelectListInner, SelectPopoverContent } from '../../select'
import { dict } from '../../../dict'
import { SelectFilterFieldProps } from '@contember/react-select'
import { getFilterName } from './utils'
import { PartialSome } from '@contember/utilities'


type DataGridRelationFilterCommonProps = {
	name: string
	options: SugaredQualifiedEntityList['entities']
	children: ReactNode
	label: ReactNode
	filterField?: string
}

export type DataGridHasOneFilterProps =
	& PartialSome<DataGridRelationFilterCommonProps, 'name'>
	& {
		field: SugaredRelativeSingleEntity['field']
	}

export const DataGridHasOneFilter = Component(({ name: nameIn, field, ...props }: DataGridHasOneFilterProps) => {
	const name = getFilterName(nameIn, field)
	return <DataGridRelationFilterInner name={name} {...props} />
}, ({ name, field }) => {
		return <DataViewFilter name={getFilterName(name, field)} filterHandler={createHasOneFilter(field)} />
})


export type DataGridHasManyFilterProps =
	& PartialSome<DataGridRelationFilterCommonProps, 'name'>
	& {
		field: SugaredRelativeEntityList['field']
	}

export const DataGridHasManyFilter = Component(({ name: nameIn, field, ...props }: DataGridHasManyFilterProps) => {
	const name = getFilterName(nameIn, field)
	return <DataGridRelationFilterInner name={name} {...props} />
}, ({ name, field }) => {
	return <DataViewFilter name={getFilterName(name, field)} filterHandler={createHasManyFilter(field)} />
})

const DataGridRelationFilterInner = Component(({ name, options, children, label, filterField }: DataGridRelationFilterCommonProps) => {
	return (
		<DataGridSingleFilterUI>
			<DataGridRelationFilterSelect name={name} options={options} label={label} filterField={filterField}>
				{children}
			</DataGridRelationFilterSelect>
			<DataGridRelationFilteredItemsList name={name} options={options}>
				{children}
			</DataGridRelationFilteredItemsList>
		</DataGridSingleFilterUI>
	)
}, () => null)


export const DataGridRelationFieldTooltip = ({ filter, children, actions }: { filter: string, children: ReactNode, actions?: ReactNode }) => (
	<TooltipProvider>
		<Tooltip>
			<TooltipTrigger asChild>
				{children}
			</TooltipTrigger>
			<TooltipContent variant={'blurred'}>
				<div className={'flex gap-1'}>
					<DataViewRelationFilterTrigger name={filter} action={'toggleInclude'}>
						<DataGridFilterActionButtonUI />
					</DataViewRelationFilterTrigger>
					<DataViewRelationFilterTrigger name={filter} action={'toggleExclude'}>
						<DataGridExcludeActionButtonUI />
					</DataViewRelationFilterTrigger>
					{actions}
				</div>
			</TooltipContent>
		</Tooltip>
	</TooltipProvider>
)

const DataGridRelationFilteredItemsList = ({ name, children, options }: {
	name: string
	options: SugaredQualifiedEntityList['entities']
	children: ReactNode
}) => (
	<>
		<DataViewRelationFilterList name={name} options={options}>
			<DataViewRelationFilterTrigger name={name} action={'unset'}>
				<DataGridActiveFilterUI>
					{children}
				</DataGridActiveFilterUI>
			</DataViewRelationFilterTrigger>
		</DataViewRelationFilterList>
		<DataViewNullFilterTrigger name={name} action={'unset'}>
			<DataGridActiveFilterUI>
				<span className={'italic'}>{dict.datagrid.na}</span>
			</DataGridActiveFilterUI>
		</DataViewNullFilterTrigger>
	</>
)

const DataGridRelationFilterSelectItem = forwardRef<HTMLButtonElement, {
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
		<DataGridFilterSelectItemUI ref={ref} onExclude={exclude} onInclude={include} isExcluded={isExcluded} isIncluded={isIncluded} {...props}>
			{children}
		</DataGridFilterSelectItemUI>
	)
})


const DataGridRelationFilterSelect = ({ name, children, options, filterField, label }: SelectFilterFieldProps & {
	name: string
	options: string | SugarableQualifiedEntityList
	children: ReactNode
	label?: ReactNode
}) => {
	const filter = filterField ? { query: createUnionTextFilter(Array.isArray(filterField) ? filterField : [filterField]) } : undefined
	let filterFactory = useDataViewRelationFilterFactory(name)
	return (
		<Popover>
			<PopoverTrigger asChild>
				<DataGridFilterSelectTriggerUI>
					{label}
				</DataGridFilterSelectTriggerUI>
			</PopoverTrigger>
			<SelectPopoverContent>
				<DataView filterTypes={filter} entities={options} onSelectHighlighted={it => {
					const [, set] = filterFactory(it.id)
					set('toggleInclude')
				}} filteringStateStorage="null" sortingStateStorage="null" currentPageStateStorage="null">
					<SelectListInner filterToolbar={<SelectDefaultFilter />}>
						<DataGridRelationFilterSelectItem filterFactory={filterFactory}>
							{children}
						</DataGridRelationFilterSelectItem>
					</SelectListInner>
				</DataView>
				<div>
					<DataGridNullFilter name={name} />
				</div>
			</SelectPopoverContent>
		</Popover>
	)
}

