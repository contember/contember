import * as React from 'react'
import { forwardRef, ReactNode, useCallback } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../ui/tooltip'
import {
	DataViewHasManyFilter,
	DataViewHasManyFilterProps,
	DataViewHasOneFilter,
	DataViewHasOneFilterProps,
	DataViewNullFilterTrigger,
	DataViewRelationFilterList,
	DataViewRelationFilterOptions,
	DataViewRelationFilterTrigger, DataViewUnionFilterFields,
	useDataViewFilterName,
	useDataViewRelationFilterFactory,
	UseDataViewRelationFilterResult,
} from '@contember/react-dataview'
import { Component, EntityId, StaticRender, useEntity } from '@contember/interface'
import { Popover, PopoverTrigger } from '../../ui/popover'
import { DataGridActiveFilterUI, DataGridExcludeActionButtonUI, DataGridFilterActionButtonUI, DataGridFilterSelectItemUI, DataGridFilterSelectTriggerUI, DataGridSingleFilterUI } from '../ui'
import { DataGridNullFilter } from './common'
import { SelectDefaultFilter, SelectListInner, SelectPopoverContent } from '../../select'
import { dict } from '../../dict'
import { DataGridFilterMobileHiding } from './mobile'


type DataGridRelationFilterInnerProps = {
	children: ReactNode
	label: ReactNode
}

export type DataGridHasOneFilterProps =
	& DataViewHasOneFilterProps
	& DataGridRelationFilterInnerProps

export const DataGridHasOneFilter = Component(({ label, children, ...props }: DataGridHasOneFilterProps) => (
	<DataViewHasOneFilter {...props}>
		<DataGridFilterMobileHiding>
			<DataGridRelationFilterInner label={label}>
				{children}
			</DataGridRelationFilterInner>
		</DataGridFilterMobileHiding>
	</DataViewHasOneFilter>
))


export type DataGridHasManyFilterProps =
	& DataViewHasManyFilterProps
	& DataGridRelationFilterInnerProps

export const DataGridHasManyFilter = Component(({ label, children, ...props }: DataGridHasManyFilterProps) => (
	<DataViewHasManyFilter {...props} >
		<DataGridFilterMobileHiding>
			<DataGridRelationFilterInner label={label}>
				{children}
			</DataGridRelationFilterInner>
		</DataGridFilterMobileHiding>
	</DataViewHasManyFilter>
))

const DataGridRelationFilterInner = Component(({ children, label }: DataGridRelationFilterInnerProps) => {
	return (
		<DataGridSingleFilterUI>
			<DataGridRelationFilterSelect label={label}>
				{children}
			</DataGridRelationFilterSelect>
			<DataGridRelationFilteredItemsList>
				{children}
			</DataGridRelationFilteredItemsList>
		</DataGridSingleFilterUI>
	)
}, () => null)

export const DataGridHasOneTooltip = Component(({ children, actions, ...props }: DataViewHasOneFilterProps & { children: ReactNode; actions?: ReactNode }) => (<>
	<DataViewHasOneFilter {...props}>
		<DataGridRelationFieldTooltipInner actions={actions}>
			{children}
		</DataGridRelationFieldTooltipInner>
	</DataViewHasOneFilter>
	<StaticRender>
		{children}
	</StaticRender>
</>))

export const DataGridHasManyTooltip = Component<DataViewHasManyFilterProps & { children: ReactNode; actions?: ReactNode }>(({ children, actions, ...props }, env) => {
	return (<>
		<DataViewHasManyFilter {...props}>
			<DataGridRelationFieldTooltipInner actions={actions}>
				{children}
			</DataGridRelationFieldTooltipInner>
		</DataViewHasManyFilter>
		<StaticRender>
			{children}
		</StaticRender>
	</>)
})

const DataGridRelationFieldTooltipInner = Component(({ children, actions }: { children: ReactNode; actions?: ReactNode }) => (
	<TooltipProvider>
		<Tooltip>
			<TooltipTrigger asChild>
				{children}
			</TooltipTrigger>
			<TooltipContent variant={'blurred'}>
				<div className={'flex gap-1'}>
					<DataViewRelationFilterTrigger action={'toggleInclude'}>
						<DataGridFilterActionButtonUI />
					</DataViewRelationFilterTrigger>
					<DataViewRelationFilterTrigger action={'toggleExclude'}>
						<DataGridExcludeActionButtonUI />
					</DataViewRelationFilterTrigger>
					{actions}
				</div>
			</TooltipContent>
		</Tooltip>
	</TooltipProvider>
))

export const DataGridRelationFilteredItemsList = ({ children }: {
	children: ReactNode
}) => (
	<>
		<DataViewRelationFilterList>
			<DataViewRelationFilterTrigger action={'unset'}>
				<DataGridActiveFilterUI>
					{children}
				</DataGridActiveFilterUI>
			</DataViewRelationFilterTrigger>
		</DataViewRelationFilterList>
		<DataViewNullFilterTrigger action={'unset'}>
			<DataGridActiveFilterUI>
				<span className={'italic'}>{dict.datagrid.na}</span>
			</DataGridActiveFilterUI>
		</DataViewNullFilterTrigger>
	</>
)

const DataGridRelationFilterSelectItem = forwardRef<HTMLButtonElement, {
	children: ReactNode
	filterFactory: (value: EntityId) => UseDataViewRelationFilterResult
}>(({ children, filterFactory, ...props }, ref) => {
			const entity = useEntity()
			const [current, setFilter] = filterFactory(entity.id)

			const include = useCallback(() => setFilter('toggleInclude'), [setFilter])
			const exclude = useCallback(() => setFilter('toggleExclude'), [setFilter])

			const isIncluded = current === 'include'
			const isExcluded = current === 'exclude'

			return (
				<DataGridFilterSelectItemUI ref={ref} onExclude={exclude} onInclude={include} isExcluded={isExcluded} isIncluded={isIncluded} {...props}>
					{children}
				</DataGridFilterSelectItemUI>
			)
		})


export const DataGridRelationFilterSelect = ({ children, queryField, label }: {
	queryField?: DataViewUnionFilterFields
	children: ReactNode
	label?: ReactNode
}) => {
	return (
		<Popover>
			<PopoverTrigger asChild>
				<DataGridFilterSelectTriggerUI>
					{label}
				</DataGridFilterSelectTriggerUI>
			</PopoverTrigger>
			<SelectPopoverContent>
				<DataGridRelationFilterControls queryField={queryField}>
					{children}
				</DataGridRelationFilterControls>
			</SelectPopoverContent>
		</Popover>
	)
}


export const DataGridRelationFilterControls = ({ children, queryField }: {
	queryField?: DataViewUnionFilterFields
	children: ReactNode
}) => {
	const filterFactory = useDataViewRelationFilterFactory(useDataViewFilterName())
	return (
		<>
			<DataViewRelationFilterOptions queryField={queryField}>
				<SelectListInner filterToolbar={<SelectDefaultFilter />}>
					<DataGridRelationFilterSelectItem filterFactory={filterFactory}>
						{children}
					</DataGridRelationFilterSelectItem>
				</SelectListInner>
			</DataViewRelationFilterOptions>
			<div>
				<DataGridNullFilter />
			</div>
		</>
	)
}
