import * as React from 'react'
import { forwardRef, ReactNode, useCallback, useMemo } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../ui/tooltip'
import {
	DataViewHasManyFilter,
	DataViewHasManyFilterProps,
	DataViewHasOneFilter,
	DataViewHasOneFilterProps,
	DataViewNullFilterTrigger,
	DataViewRelationFilterList,
	DataViewRelationFilterOptions,
	DataViewRelationFilterTrigger,
	DataViewUnionFilterFields,
	useDataViewFilterName,
	useDataViewRelationFilterFactory,
	UseDataViewRelationFilterResult,
} from '@contember/react-dataview'
import { Component, EntityId, StaticRender, useEntity } from '@contember/interface'
import { Popover, PopoverTrigger } from '../../ui/popover'
import {
	DataGridActiveFilterUI,
	DataGridExcludeActionButtonUI,
	DataGridFilterActionButtonUI,
	DataGridFilterSelectItemUI,
	DataGridFilterSelectTriggerUI,
	DataGridSingleFilterUI,
} from '../ui'
import { DataGridNullFilter } from './common'
import { SelectDefaultFilter, SelectListInner, SelectPopoverContent } from '../../select'
import { dict } from '../../dict'
import { DataGridFilterMobileHiding } from './mobile'
import { DataViewHasManyLabel, DataViewHasOneLabel } from '../labels'
import { createRequiredContext } from '@contember/react-utils'

/**
 * Props for {@link DataGridHasOneFilter}.
 */
export type DataGridHasOneFilterProps =
	& DataViewHasOneFilterProps
	& {
		children: ReactNode
		label: ReactNode
	}
/**
 * Has one filter for DataGrid with default UI.
 *
 * ## Props {@link DataGridHasOneFilterProps}
 * field, label, children, ?name, ?options
 *
 * ## Example
 * ```tsx
 * <DataGridHasOneFilter field={'author'} label="Author">
 *     <Field field="name" />
 * </DataGridHasOneFilter>
 * ```
 */
export const DataGridHasOneFilter = Component(({ label, children, ...props }: DataGridHasOneFilterProps) => (
	<DataViewHasOneFilter {...props}>
		<DataGridFilterMobileHiding>
			<DataGridRelationFilterInner label={label ?? <DataViewHasOneLabel field={props.field} />}>
				{children}
			</DataGridRelationFilterInner>
		</DataGridFilterMobileHiding>
	</DataViewHasOneFilter>
))

/**
 * Props for {@link DataGridHasManyFilter}.
 */
export type DataGridHasManyFilterProps =
	& DataViewHasManyFilterProps
	& {
		children: ReactNode
		label: ReactNode
	}
/**
 * Has many filter for DataGrid with default UI.
 *
 * ## Props {@link DataGridHasManyFilterProps}
 * field, label, children, ?name, ?options
 *
 * ## Example
 * ```tsx
 * <DataGridHasManyFilter field={'tags'} label="Tags">
 *     <Field field="name" />
 * </DataGridHasManyFilter>
 * ```
 */
export const DataGridHasManyFilter = Component(({ label, children, ...props }: DataGridHasManyFilterProps) => (
	<DataViewHasManyFilter {...props} >
		<DataGridFilterMobileHiding>
			<DataGridRelationFilterInner label={label ?? <DataViewHasManyLabel field={props.field} />}>
				{children}
			</DataGridRelationFilterInner>
		</DataGridFilterMobileHiding>
	</DataViewHasManyFilter>
))

const DataGridRelationFilterInner = Component(({ children, label }: {
	children: ReactNode
	label: ReactNode
}) => {
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

/**
 * Props for {@link DataGridHasOneTooltip}.
 */
export type DataGridHasOneTooltipProps =
	& DataViewHasOneFilterProps
	& {
		children: ReactNode
		/**
		 * Custom actions to render in the tooltip.
		 */
		actions?: ReactNode
	}

/**
 * Component for rendering a value with a tooltip that allows to include/exclude the value from the filter.
 * Used in DataGridHasOneColumn, but can be used in custom columns as well.
 *
 * ## Props {@link DataGridHasOneTooltipProps}
 * field, children, ?name, ?options, ?actions
 *
 * ## Example
 * ```tsx
 * <HasOne field="category">
 * <DataGridHasOneTooltip field={'category'}>
 *     <button className="text-lg font-semibold text-gray-600">
 *        <Field field="category.name" />
 *     </button>
 *  </button>
 * </DataGridHasOneTooltip>
 * </HasOne>
 * ```
 */
export const DataGridHasOneTooltip = Component<DataGridHasOneTooltipProps>(({ children, actions, ...props }) => (<>
	<DataViewHasOneFilter {...props}>
		<DataGridRelationFieldTooltipInner actions={actions}>
			{children}
		</DataGridRelationFieldTooltipInner>
	</DataViewHasOneFilter>
	<StaticRender>
		{children}
	</StaticRender>
</>))

/**
 * Props for {@link DataGridHasManyTooltip}.
 */
export type DataGridHasManyTooltipProps =
	& DataViewHasManyFilterProps
	& {
		children: ReactNode
		/**
		 * Custom actions to render in the tooltip.
		 */
		actions?: ReactNode
	}

/**
 * Component for rendering a value with a tooltip that allows to include/exclude the value from the filter.
 * Used in DataGridHasManyColumn, but can be used in custom columns as well.
 *
 * ## Props {@link DataGridHasManyTooltipProps}
 * field, children, ?name, ?options, ?actions
 *
 * ## Example
 * ```tsx
 * <HasMany field="tags">
 *     <DataGridHasManyTooltip field={'tags'}>
 *         <button className="text-sm border rounded px-2 py-1">
 *             <Field field="name" />
 *         </button>
 *     </DataGridHasManyTooltip>
 * </HasMany>
 * ```
 */
export const DataGridHasManyTooltip = Component<DataGridHasManyTooltipProps>(({ children, actions, ...props }) => {
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

/**
 * @internal
 */
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

const [, useFilterFactory, FilterFactoryContextProvider] = createRequiredContext<(value: EntityId) => UseDataViewRelationFilterResult>('FilterFactoryContext')

type DataGridRelationFilterSelectItemProps = {
	children: ReactNode
}
const DataGridRelationFilterSelectItem = forwardRef<HTMLButtonElement, DataGridRelationFilterSelectItemProps>(({
	children,
	...props
}, ref) => {
	const entity = useEntity()
	const filterFactory = useFilterFactory()
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


const DataGridRelationFilterSelect = ({ children, queryField, label }: {
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

/**
 * @internal
 */
export const DataGridRelationFilterControls = ({ children, queryField }: {
	queryField?: DataViewUnionFilterFields
	children: ReactNode
}) => {
	const inner = useMemo(() => <DataGridRelationFilterControlsInner>{children}</DataGridRelationFilterControlsInner>, [children])
	const filterFactory = useDataViewRelationFilterFactory(useDataViewFilterName())
	return (
		<FilterFactoryContextProvider value={filterFactory}>
			<DataViewRelationFilterOptions queryField={queryField}>
				{inner}
			</DataViewRelationFilterOptions>
			<div>
				<DataGridNullFilter />
			</div>
		</FilterFactoryContextProvider>
	)
}

type DataGridRelationFilterControlsInnerProps = {
	children: ReactNode
}
const DataGridRelationFilterControlsInner = Component<DataGridRelationFilterControlsInnerProps>(({ children }) => {

	return <>
		<SelectListInner filterToolbar={<SelectDefaultFilter />}>
			<DataGridRelationFilterSelectItem>
				{children}
			</DataGridRelationFilterSelectItem>
		</SelectListInner>
	</>
})
