import { Component, Field, SugaredRelativeEntityList, SugaredRelativeSingleEntity } from '@contember/interface'
import * as React from 'react'
import { ReactNode } from 'react'
import { TableCell, TableHead } from '../ui/table'
import { DataGridColumnHeader } from './column-header'
import {
	DataViewBooleanFilter,
	DataViewDateFilter,
	DataViewElement,
	DataViewEnumFilter,
	DataViewHasManyFilter,
	DataViewHasOneFilter,
	DataViewIsDefinedFilter,
	DataViewNumberFilter,
	DataViewTextFilter,
} from '@contember/react-dataview'
import { formatBoolean, formatDate, formatDateTime, formatNumber } from '../formatting'
import { DataGridEnumCell, DataGridHasManyCell, DataGridHasOneCell } from './cells'
import { cn } from '../utils'
import {
	DataGridBooleanFilterControls,
	DataGridDateFilterControls,
	DataGridEnumFilterControls,
	DataGridIsDefinedFilterControls,
	DataGridNumberFilterControls,
	DataGridRelationFilterControls,
	DataGridRelationFilteredItemsList,
	DataGridTextFilterInner,
} from './filters'
import { CheckIcon, XIcon } from 'lucide-react'
import { DataViewFieldLabel, DataViewHasManyLabel, DataViewHasOneLabel } from './labels'
import { DataGridColumnLeaf } from './column-leaf'

/**
 * Renders a column with action buttons. Should be used in a {@link DataGridTable}.
 *
 * ## Example
 * ```tsx
 * <DataGridTable>
 *     <DataGridActionColumn>
 *         <Button>Click me</Button>
 *     </DataGridActionColumn>
 * </DataGridTable>
 * ```
 */
export const DataGridActionColumn = Component<{ children: ReactNode }>(({ children }) => (
	<DataGridColumnLeaf
		header={<TableHead className="w-0"></TableHead>}
		cell={<TableCell className="w-0">{children}</TableCell>}
	/>
))

/**
 * Props for {@link DataGridTextColumn}.
 */
export type DataGridTextColumnProps = {
	/**
	 * Displayed field.
	 */
	field: string

	/**
	 * Custom header. If not provided, the label formatter is used.
	 */
	header?: ReactNode

	/**
	 * Custom cell content. If not provided, the field value is displayed.
	 */
	children?: ReactNode

	/**
	 * Custom value formatter.
	 */
	format?: (value: string | null) => ReactNode

	/**
	 * Custom filter. If not provided, a default text filter is used.
	 */
	filter?: ReactNode
}

/**
 * Renders a column with text content and column controls in a header. Should be used in a {@link DataGridTable}.
 *
 * ## Example
 * ```tsx
 * <DataGridTable>
 *     <DataGridTextColumn field="title" />
 *     <DataGridTextColumn field="description" format={it => it.slice(0, 100)} />
 * </DataGridTable>
 * ```
 */
export const DataGridTextColumn = Component<DataGridTextColumnProps>(({ field, header, children, format, filter }) => (
	<DataGridColumn
		header={header ?? <DataViewFieldLabel field={field}/>}
		sortingField={field}
		name={field}
		children={children ?? <Field field={field} format={format} />}
		filterName={field}
		filter={filter ?? <DataViewTextFilter field={field}>
			<DataGridTextFilterInner />
		</DataViewTextFilter>}
	/>
))

/**
 * Props for {@link DataGridBooleanColumn}.
 */
export type DataGridBooleanColumnProps = {
	/**
	 * Displayed field.
	 */
	field: string
	/**
	 * Custom header. If not provided, the label formatter is used.
	 */
	header?: ReactNode
	/**
	 * Custom cell content. If not provided, the field value is displayed.
	 */
	children?: ReactNode
	/**
	 * Custom value formatter.
	 */
	format?: (value: boolean | null) => ReactNode
	/**
	 * Custom filter. If not provided, a default boolean filter is used.
	 */
	filter?: ReactNode
}

/**
 * Renders a column with boolean content. Should be used in a {@link DataGridTable}.
 *
 * ## Example
 * ```tsx
 * <DataGridTable>
 *     <DataGridBooleanColumn field="isPublished" />
 * </DataGridTable>
 * ```
 */
export const DataGridBooleanColumn = Component<DataGridBooleanColumnProps>(({ field, header, children, format, filter }) => (
	<DataGridColumn
		header={header ?? <DataViewFieldLabel field={field} />}
		sortingField={field}
		name={field}
		children={children ?? <Field field={field} format={format ?? formatBoolean} />}
		filterName={field}
		filter={filter ?? <DataViewBooleanFilter field={field}>
			<div className="border rounded p-2">
				<DataGridBooleanFilterControls />
			</div>
		</DataViewBooleanFilter>}
	/>
))

/**
 * Props for {@link DataGridNumberColumn}.
 */
export type DataGridNumberColumnProps = {
	/**
	 * Displayed field.
	 */
	field: string
	/**
	 * Custom header. If not provided, the label formatter is used.
	 */
	header?: ReactNode
	/**
	 * Custom cell content. If not provided, the field value is displayed.
	 */
	children?: ReactNode
	/**
	 * Custom value formatter.
	 */
	format?: (value: number | null) => ReactNode
	/**
	 * Custom filter. If not provided, a default number filter is used.
	 */
	filter?: ReactNode
}

/**
 * Renders a column with number content. Should be used in a {@link DataGridTable}.
 *
 * ## Example
 * ```tsx
 * <DataGridTable>
 *     <DataGridNumberColumn field="price" format={it => it.toFixed(2)} />
 * </DataGridTable>
 * ```
 */
export const DataGridNumberColumn = Component<DataGridNumberColumnProps>(({ field, header, children, format, filter }) => (
	<DataGridColumn
		header={header ?? <DataViewFieldLabel field={field} />}
		sortingField={field}
		name={field}
		children={children ?? <Field field={field} format={format ?? formatNumber} />}
		filterName={field}
		filter={filter ?? <DataViewNumberFilter field={field}>
			<div className="border rounded max-w-60 p-2">
				<DataGridNumberFilterControls/>
			</div>
		</DataViewNumberFilter>}
	/>
))
/**
 * Props for {@link DataGridDateColumn}.
 */
export type DataGridDateColumnProps = {
	/**
	 * Displayed field.
	 */
	field: string
	/**
	 * Custom header. If not provided, the label formatter is used.
	 */
	header?: ReactNode
	/**
	 * Custom cell content. If not provided, the field value is displayed.
	 */
	children?: ReactNode
	/**
	 * Custom value formatter. If not provided, the default date formatter is used.
	 */
	format?: (value: string | null) => ReactNode
	/**
	 * Custom filter. If not provided, a default date filter is used.
	 */
	filter?: ReactNode
}

/**
 * Renders a column with date content. Should be used in a {@link DataGridTable}.
 *
 * ## Example
 * ```tsx
 * <DataGridTable>
 *     <DataGridDateColumn field="createdAt" />
 * </DataGridTable>
 * ```
 */
export const DataGridDateColumn = Component<DataGridDateColumnProps>(({ field, header, children, format, filter }) => (
	<DataGridColumn
		header={header ?? <DataViewFieldLabel field={field} />}
		sortingField={field}
		name={field}
		children={children ?? <Field field={field} format={format ?? formatDate} />}
		filterName={field}
		filter={filter ?? <DataViewDateFilter field={field}>
			<div className="border rounded">
				<DataGridDateFilterControls layout="row"/>
			</div>
		</DataViewDateFilter>}
	/>
))

/**
 * Props for {@link DataGridDateTimeColumn}.
 */
export type DataGridDateTimeColumnProps = {
	/**
	 * Displayed field.
	 */
	field: string
	/**
	 * Custom header. If not provided, the label formatter is used.
	 */
	header?: ReactNode
	/**
	 * Custom cell content. If not provided, the field value is displayed.
	 */
	children?: ReactNode
	/**
	 * Custom value formatter. If not provided, the default date-time formatter is used.
	 */
	format?: (value: string | null) => ReactNode
	/**
	 * Custom filter. If not provided, a default date filter is used.
	 */
	filter?: ReactNode
}

/**
 * Renders a column with date-time content. Should be used in a {@link DataGridTable}.
 *
 * ## Example
 * ```tsx
 * <DataGridTable>
 *     <DataGridDateTimeColumn field="createdAt" />
 * </DataGridTable>
 * ```
 */
export const DataGridDateTimeColumn = Component<DataGridDateTimeColumnProps>(({ field, header, children, format, filter }) => (
	<DataGridColumn
		header={header ?? <DataViewFieldLabel field={field} />}
		sortingField={field}
		name={field}
		children={children ?? <Field field={field} format={format ?? formatDateTime} />}
		filterName={field}
		filter={filter ?? <DataViewDateFilter field={field}>
			<div className="border rounded">
				<DataGridDateFilterControls layout="row" />
			</div>
		</DataViewDateFilter>}

	/>
))

/**
 * Props for {@link DataGridEnumColumn}.
 */
export type DataGridEnumColumnProps = {

	/**
	 * Displayed field.
	 */
	field: string

	/**
	 * Custom header. If not provided, the label formatter is used.
	 */
	header?: ReactNode

	/**
	 * Enum options for value formatting and filter options. If not provided, the options are resolved from the enum.
	 */
	options?: Record<string, ReactNode>

	/**
	 * Custom cell content. If not provided, the field value with a tooltip is displayed.
	 */
	children?: ReactNode

	/**
	 * Custom filter. If not provided, a default enum filter is used.
	 */
	filter?: ReactNode

	/**
	 * Additional actions in the tooltip.
	 */
	tooltipActions?: ReactNode
}

/**
 * Renders a column with enum content. Should be used in a {@link DataGridTable}.
 *
 * ## Example
 * ```tsx
 * <DataGridTable>
 *     <DataGridEnumColumn field="status" />
 *     <DataGridEnumColumn field="status" options={{ active: 'Active', inactive: 'Inactive' }} />
 * </DataGridTable>
 * ```
 */
export const DataGridEnumColumn = Component<DataGridEnumColumnProps>(({ field, header, options, children, tooltipActions, filter }) => (<>
	<DataGridColumn
		header={header ?? <DataViewFieldLabel field={field} />}
		sortingField={field}
		name={field}
		children={children ?? <DataGridEnumCell field={field} options={options} tooltipActions={tooltipActions} />}
		filterName={field}
		filter={filter ?? <DataViewEnumFilter field={field}>
			<div className="max-w-60 border rounded p-2">
				<DataGridEnumFilterControls options={options} />
			</div>
		</DataViewEnumFilter>}
	/>
</>))

/**
 * Props for {@link DataGridIsDefinedColumn}.
 */
export type DataGridIsDefinedColumnProps = {
	/**
	 * Displayed field.
	 */
	field: string
	/**
	 * Custom header. If not provided, the label formatter is used.
	 */
	header?: ReactNode

	/**
	 * Custom cell content. If not provided, a checkmark or a cross is displayed.
	 */
	children?: ReactNode

	/**
	 * Custom value formatter.
	 */
	format?: (value: boolean) => ReactNode

	/**
	 * Custom filter. If not provided, a default is-defined filter is used.
	 */
	filter?: ReactNode
	filterName?: string
}

/**
 * Renders a column with is-defined content. Should be used in a {@link DataGridTable}.
 *
 * ## Example
 * ```tsx
 * <DataGridTable>
 *     <DataGridIsDefinedColumn field="coverImage.url" />
 * </DataGridTable>
 * ```
 */
export const DataGridIsDefinedColumn = Component<DataGridIsDefinedColumnProps>(({ field, header, children, format, filter, filterName }) => (
	<DataGridColumn
		header={header ?? <DataViewFieldLabel field={field} />}
		name={field}
		children={children ?? <Field field={field} format={it => {
			if (format) {
				return format(it !== null)
			}
			return it !== null ? <CheckIcon size={16} /> : <XIcon size={16} />
		}} />}
		filterName={filterName ?? field}
		filter={filter ?? <DataViewIsDefinedFilter field={field} name={filterName}>
			<DataGridIsDefinedFilterControls />
		</DataViewIsDefinedFilter>}
	/>
))

/**
 * Props for {@link DataGridUuidColumn}.
 */
export type DataGridUuidColumnProps = {
	/**
	 * Displayed field.
	 */
	field: string
	/**
	 * Custom header. If not provided, the label formatter is used.
	 */
	header?: ReactNode
	/**
	 * Custom cell content. If not provided, the field value is displayed.
	 */
	children?: ReactNode
	/**
	 * Custom value formatter.
	 */
	format?: (value: string | null) => ReactNode
}


/**
 * Renders a column with UUID content. Should be used in a {@link DataGridTable}.
 */
export const DataGridUuidColumn = Component<DataGridUuidColumnProps>(({ field, header, children, format }) => (
	<DataGridColumn
		header={header ?? <DataViewFieldLabel field={field} />}
		sortingField={field}
		name={field}
		children={children ?? <Field field={field} format={format} />}
	/>
))

/**
 * Props for {@link DataGridHasOneColumn}.
 */
export type DataGridHasOneColumnProps = {
	/**
	 * Has-one relation field.
	 */
	field: SugaredRelativeSingleEntity['field']
	/**
	 * Filter identifier. If not provided, the filter is resolved from the field name.
	 */
	filterName?: string
	/**
	 * Cell content in the context of the has-one relation.
	 */
	children: ReactNode
	/**
	 * Custom header. If not provided, the label formatter is used.
	 */
	header?: ReactNode
	/**
	 * Custom filter. If not provided, a default has-one filter is used.
	 */
	filter?: ReactNode
	/**
	 * Additional actions in the tooltip.
	 */
	tooltipActions?: ReactNode
}

/**
 * Renders a column with has-one relation content. Should be used in a {@link DataGridTable}.
 *
 * ## Example
 * ```tsx
 * <DataGridTable>
 *     <DataGridHasOneColumn field="author">
 *         <Field field="name" />
 *     </DataGridHasOneColumn>
 * </DataGridTable>
 * ```
 */
export const DataGridHasOneColumn = Component<DataGridHasOneColumnProps>(({ field, header, children, filter, filterName, tooltipActions }) => (
	<DataGridColumn
		header={header ?? <DataViewHasOneLabel field={field} />}
		name={typeof field === 'string' ? field : undefined}
		children={<DataGridHasOneCell field={field} filterName={filterName} tooltipActions={tooltipActions}>{children}</DataGridHasOneCell>}
		filterName={filterName ?? (typeof field === 'string' ? field : undefined)}
		filter={filter ?? <DataViewHasOneFilter field={field} name={filterName}>
			<div className="border rounded p-2 max-w-60 flex flex-col gap-2">
				<div className="flex flex-wrap gap-2">
					<DataGridRelationFilteredItemsList>
						{children}
					</DataGridRelationFilteredItemsList>
				</div>
				<DataGridRelationFilterControls>
					{children}
				</DataGridRelationFilterControls>
			</div>
		</DataViewHasOneFilter>}
	/>
))

/**
 * Props for {@link DataGridHasManyColumn}.
 */
export type DataGridHasManyColumnProps = {
	/**
	 * Has-many relation field.
	 */
	field: SugaredRelativeEntityList['field']
	/**
	 * Filter identifier. If not provided, the filter is resolved from the field name.
	 */
	filterName?: string
	/**
	 * Cell content in the context of the has-many relation.
	 */
	children: ReactNode
	/**
	 * Custom header. If not provided, the label formatter is used.
	 */
	header?: ReactNode
	/**
	 * Custom filter. If not provided, a default has-many filter is used.
	 */
	filter?: ReactNode
	/**
	 * Additional actions in the tooltip.
	 */
	tooltipActions?: ReactNode
}

/**
 * Renders a column with has-many relation content. Should be used in a {@link DataGridTable}.
 *
 * ## Example
 * ```tsx
 * <DataGridTable>
 *     <DataGridHasManyColumn field="tags">
 *         <Field field="name" />
 *     </DataGridHasManyColumn>
 * </DataGridTable>
 * ```
 */
export const DataGridHasManyColumn = Component<DataGridHasManyColumnProps>(({ field, header, children, filter, filterName, tooltipActions }) => (
	<DataGridColumn
		header={header ?? <DataViewHasManyLabel field={field} />}
		name={typeof field === 'string' ? field : undefined}
		children={<DataGridHasManyCell field={field} filterName={filterName} tooltipActions={tooltipActions}>{children}</DataGridHasManyCell>}
		filterName={filterName ?? (typeof field === 'string' ? field : undefined)}
		filter={filter ?? <DataViewHasManyFilter field={field} name={filterName}>
			<div className="border rounded p-2 max-w-60 flex flex-col gap-2">
				<div className="flex flex-wrap gap-2">
					<DataGridRelationFilteredItemsList>
						{children}
					</DataGridRelationFilteredItemsList>
				</div>
				<DataGridRelationFilterControls>
					{children}
				</DataGridRelationFilterControls>
			</div>
		</DataViewHasManyFilter>}
	/>
))

/**
 * Props for {@link DataGridColumn}.
 */
export type DataGridColumnProps = {
	children: ReactNode
	header?: ReactNode
	name?: string
	hidingName?: string
	sortingField?: string
	cellClassName?: string
	headerClassName?: string
	filter?: ReactNode
	filterName?: string
}

/**
 * Low-level component for rendering a column in a data grid.
 */
export const DataGridColumn = Component<DataGridColumnProps>(({ children, header, name, hidingName, sortingField, cellClassName, headerClassName, filter, filterName }) => {
	const wrapIsVisible = (child: ReactNode) => {
		const resolvedName = hidingName ?? name
		return resolvedName ? <DataViewElement name={resolvedName} label={header}>{child}</DataViewElement> : child
	}

	return (
		<DataGridColumnLeaf
			name={name}
			header={
				wrapIsVisible(
					<TableHead className={cn('text-center', headerClassName)}>
						<DataGridColumnHeader hidingName={hidingName ?? name} sortingField={sortingField} filter={filter} filterName={filterName}>
							{header}
						</DataGridColumnHeader>
					</TableHead>,
				)
			}
			cell={wrapIsVisible(<TableCell className={cellClassName}>{children}</TableCell>)}
		/>
	)
})
