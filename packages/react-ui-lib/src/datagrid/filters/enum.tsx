import { ReactNode, useCallback } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../ui/tooltip'
import {
	DataViewEnumFilter,
	DataViewEnumFilterProps,
	DataViewEnumFilterTrigger,
	DataViewEnumListFilter,
	DataViewNullFilterTrigger,
	UseDataViewEnumFilter,
	useDataViewEnumFilterArgs,
	useDataViewEnumFilterFactory,
	useDataViewFilterName,
} from '@contember/react-dataview'
import { Component } from '@contember/interface'
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover'
import {
	DataGridActiveFilterUI,
	DataGridExcludeActionButtonUI,
	DataGridFilterActionButtonUI,
	DataGridFilterSelectItemUI,
	DataGridFilterSelectTriggerUI,
	DataGridSingleFilterUI,
} from '../ui'
import { DataGridNullFilter } from './common'
import { dict } from '../../dict'
import { DataGridFilterMobileHiding } from './mobile'
import { useEnumOptionsFormatter } from '../../labels'
import { DataViewFieldLabel } from '../labels'

/**
 * Props for {@link DataGridEnumFilter}.
 */
export interface DataGridEnumFilterProps extends Omit<DataViewEnumFilterProps, 'children'> {
	/**
	 * Options for the filter.
	 */
	options?: Record<string, ReactNode>
	/**
	 * Label for the filter.
	 */
	label?: ReactNode
}

/**
 * Props {@link DataGridEnumFilterProps}
 *
 * `DataGridEnumFilter` is an enum-based filter component for `DataGrid` with a default UI.
 * It allows filtering records based on predefined enum values.
 *
 * #### Example: Basic usage
 * ```tsx
 * <DataGridEnumFilter field="status" />
 * ```
 *
 * #### Example: With custom enum options
 * ```tsx
 * <DataGridEnumFilter
 *   field="status"
 *   options={[
 *     { value: 'active', label: 'Active' },
 *     { value: 'inactive', label: 'Inactive' }
 *   ]}
 * />
 * ```
 */
export const DataGridEnumFilter = Component(({ options, label, ...props }: DataGridEnumFilterProps) => (
	<DataViewEnumFilter {...props}>
		<DataGridFilterMobileHiding>
			<DataGridSingleFilterUI>
				<DataGridEnumFilterSelect options={options} label={label ?? <DataViewFieldLabel field={props.field} />} />
				<DataGridEnumFilterList options={options} />
			</DataGridSingleFilterUI>
		</DataGridFilterMobileHiding>
	</DataViewEnumFilter>
))


/**
 * Props for {@link DataGridEnumListFilter}.
 */
export interface DataGridEnumListFilterProps extends Omit<DataViewEnumFilterProps, 'children'> {
	/**
	 * Options for the filter.
	 */
	options?: Record<string, ReactNode>
	/**
	 * Label for the filter.
	 */
	label?: ReactNode
}

/**
 * Props {@link DataGridEnumListFilterProps}
 *
 * `DataGridEnumListFilter` is a multi-select enum filter component for `DataGrid` with a default UI.
 * It allows filtering records by selecting multiple predefined enum values.
 *
 * - Wraps `DataViewEnumListFilter` to handle multi-selection filtering.
 * - Uses `DataGridSingleFilterUI` for a structured filter layout.
 * - Supports custom labels or defaults to the field's label.
 * - Accepts an `options` prop to define available enum values.
 *
 * #### Example: Basic usage
 * ```tsx
 * <DataGridEnumListFilter field="status" />
 * ```
 *
 * #### Example: With custom enum options
 * ```tsx
 * <DataGridEnumListFilter
 *   field="status"
 *   options={[
 *     { value: 'active', label: 'Active' },
 *     { value: 'inactive', label: 'Inactive' },
 *     { value: 'pending', label: 'Pending' }
 *   ]}
 * />
 * ```
 */
export const DataGridEnumListFilter = Component(({ options, label, ...props }: DataGridEnumListFilterProps) => (
	<DataViewEnumListFilter {...props}>
		<DataGridFilterMobileHiding>
			<DataGridSingleFilterUI>
				<DataGridEnumFilterSelect options={options} label={label ?? <DataViewFieldLabel field={props.field} />} />
				<DataGridEnumFilterList options={options} />
			</DataGridSingleFilterUI>
		</DataGridFilterMobileHiding>
	</DataViewEnumListFilter>
))


/**
 * Props for {@link DataGridEnumFieldTooltip}.
 */
export type DataGridEnumFieldTooltipProps = Omit<DataViewEnumFilterProps, 'children'>

/**
 * Props {@link DataGridEnumFieldTooltipProps}
 *
 * `DataGridEnumFieldTooltip` renders a value with a tooltip that allows users to include or exclude
 * the value from the filter. It is primarily used in {@link DataGridEnumColumn}, but can be
 * utilized in custom columns as well.
 *
 * #### Example: Basic usage inside a custom column
 * ```tsx
 * <DataGridEnumFieldTooltip value="active">
 *   <span>Active</span>
 * </DataGridEnumFieldTooltip>
 * ```
 *
 * #### Example: With additional actions
 * ```tsx
 * <DataGridEnumFieldTooltip value="inactive" actions={<CustomActionButton />}>
 *   <span>Inactive</span>
 * </DataGridEnumFieldTooltip>
 * ```
 */
export const DataGridEnumFieldTooltip = ({ children, actions, value, ...props }: DataGridEnumFieldTooltipProps & { children: ReactNode; value: string; actions?: ReactNode }) => (
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

const DataGridEnumFilterList = ({ options }: { options?: Record<string, ReactNode> }) => {
	const resolvedOptions = useEnumOptions(options)

	return (
		<>
			{Object.entries(resolvedOptions).map(([value, label]) => (
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
}

type DataGridEnumFilterSelectItemProps = {
	value: string
	children: ReactNode
	filterFactory: (value: string) => UseDataViewEnumFilter
}

const DataGridEnumFilterSelectItem = ({ value, children, filterFactory }: DataGridEnumFilterSelectItemProps) => {
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

const DataGridEnumFilterSelect = ({ options, label }: { options?: Record<string, ReactNode>; label?: ReactNode }) => (
	<Popover>
		<PopoverTrigger asChild>
			<DataGridFilterSelectTriggerUI>{label}</DataGridFilterSelectTriggerUI>
		</PopoverTrigger>
		<PopoverContent className="p-2">
			<DataGridEnumFilterControls options={options} />
		</PopoverContent>
	</Popover>
)

/**
 * @internal
 */
export const DataGridEnumFilterControls = ({ options }: { options?: Record<string, ReactNode> }) => {
	const filterFactory = useDataViewEnumFilterFactory(useDataViewFilterName())
	const resolvedOptions = useEnumOptions(options)

	return (
		<div className={'relative flex flex-col gap-2'}>
			{Object.entries(resolvedOptions).map(([value, label]) => (
				<DataGridEnumFilterSelectItem value={value} key={value} filterFactory={filterFactory}>
					{label}
				</DataGridEnumFilterSelectItem>
			))}
			<DataGridNullFilter />
		</div>
	)
}

const useEnumOptions = (preferred: Record<string, ReactNode> | undefined): Record<string, ReactNode> => {
	const enumOptionsProvider = useEnumOptionsFormatter()
	const enumName = useDataViewEnumFilterArgs().enumName

	return preferred ?? enumOptionsProvider(enumName)
}
