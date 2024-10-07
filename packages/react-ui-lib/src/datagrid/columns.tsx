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
import { DataGridEnumCell, DataGridHasManyCell, DataGridHasManyCellProps, DataGridHasOneCell, DataGridHasOneCellProps } from './cells'
import { cn } from '../utils'
import {
	DataGridBooleanFilterControls,
	DataGridDateFilterControls,
	DataGridEnumFilterControls,
	DataGridNumberFilterControls,
	DataGridRelationFilterControls,
	DataGridRelationFilteredItemsList,
	DataGridTextFilterInner,
} from './filters'
import { CheckIcon, XIcon } from 'lucide-react'
import { DataGridIsDefinedFilterControls } from './filters/defined'

export const DataGridActionColumn = Component<{ children: ReactNode }>(({ children }) => (
	<DataGridColumnLeaf
		header={<TableHead className="w-0"></TableHead>}
		cell={<TableCell className="w-0">{children}</TableCell>}
	/>
))


export type DataGridTextColumnProps = {
	field: string
	header: ReactNode
	children?: ReactNode
	format?: (value: string | null) => ReactNode
	filter?: ReactNode
}

export const DataGridTextColumn = Component<DataGridTextColumnProps>(({ field, header, children, format, filter }) => (
	<DataGridColumn
		header={header}
		sortingField={field}
		name={field}
		children={children ?? <Field field={field} format={format} />}
		filterName={field}
		filter={filter ?? <DataViewTextFilter field={field}>
			<DataGridTextFilterInner />
		</DataViewTextFilter>}
	/>
))

export type DataGridBooleanColumnProps = {
	field: string
	header: ReactNode
	children?: ReactNode
	format?: (value: boolean | null) => ReactNode
	filter?: ReactNode
}

export const DataGridBooleanColumn = Component<DataGridBooleanColumnProps>(({ field, header, children, format, filter }) => (
	<DataGridColumn
		header={header}
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

export type DataGridNumberColumnProps = {
	field: string
	header: ReactNode
	children?: ReactNode
	format?: (value: number | null) => ReactNode
	filter?: ReactNode
}

export const DataGridNumberColumn = Component<DataGridNumberColumnProps>(({ field, header, children, format, filter }) => (
	<DataGridColumn
		header={header}
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

export type DataGridDateColumnProps = {
	field: string
	header: ReactNode
	children?: ReactNode
	format?: (value: string | null) => ReactNode
	filter?: ReactNode
}

export const DataGridDateColumn = Component<DataGridDateColumnProps>(({ field, header, children, format, filter }) => (
	<DataGridColumn
		header={header}
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


export type DataGridDateTimeColumnProps = {
	field: string
	header: ReactNode
	children?: ReactNode
	format?: (value: string | null) => ReactNode
	filter?: ReactNode
}

export const DataGridDateTimeColumn = Component<DataGridDateTimeColumnProps>(({ field, header, children, format, filter }) => (
	<DataGridColumn
		header={header}
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

export type DataGridEnumColumnProps = {
	field: string
	header: ReactNode
	options: Record<string, ReactNode>
	children?: ReactNode
	filter?: ReactNode
	tooltipActions?: ReactNode
}

export const DataGridEnumColumn = Component<DataGridEnumColumnProps>(({ field, header, options, children, tooltipActions, filter }) => (<>
	<DataGridColumn
		header={header}
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


export type DataGridIsDefinedColumnProps = {
	field: string
	header: ReactNode
	children?: ReactNode
	format?: (value: boolean) => ReactNode
	filter?: ReactNode
	filterName?: string
}

export const DataGridIsDefinedColumn = Component<DataGridIsDefinedColumnProps>(({ field, header, children, format, filter, filterName }) => (
	<DataGridColumn
		header={header}
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


export type DataGridUuidColumnProps = {
	field: string
	header: ReactNode
	children?: ReactNode
	format?: (value: string | null) => ReactNode
}


export const DataGridUuidColumn = Component<DataGridUuidColumnProps>(({ field, header, children, format }) => (
	<DataGridColumn
		header={header}
		sortingField={field}
		name={field}
		children={children ?? <Field field={field} format={format} />}
	/>
))

export type DataGridHasOneColumnProps = {
	field: SugaredRelativeSingleEntity['field']
	filterName?: string
	children: ReactNode
	header: ReactNode
	filter?: ReactNode
	tooltipActions?: ReactNode
}

export const DataGridHasOneColumn = Component<DataGridHasOneColumnProps>(({ field, header, children, filter, filterName, tooltipActions }) => (
	<DataGridColumn
		header={header}
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

export type DataGridHasManyColumnProps = {
	field: SugaredRelativeEntityList['field']
	filterName?: string
	children: ReactNode
	header: ReactNode
	filter?: ReactNode
	tooltipActions?: ReactNode
}

export const DataGridHasManyColumn = Component<DataGridHasManyColumnProps>(({ field, header, children, filter, filterName, tooltipActions }) => (
	<DataGridColumn
		header={header}
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

export interface DataGridColumnLeafProps {
	header: ReactNode
	cell: ReactNode
	name?: string
}

export const DataGridColumnLeaf = Component<DataGridColumnLeafProps>(() => {
	throw new Error('DataGridColumnLeaf is not supposed to be rendered')
}, ({ header, cell }) => {
	return <>{header}{cell}</>
})

