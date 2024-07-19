import { Component, Field } from '@contember/interface'
import * as React from 'react'
import { ReactNode } from 'react'
import { TableCell, TableHead } from '../ui/table'
import { DataGridColumnHeader } from './column-header'
import { DataViewElement, DataViewEnumFilter } from '@contember/react-dataview'
import { formatBoolean, formatDate, formatDateTime, formatNumber } from '../formatting'
import { DataGridEnumCell, DataGridHasManyCell, DataGridHasManyCellProps, DataGridHasOneCell, DataGridHasOneCellProps } from './cells'
import { cn } from '../utils'

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
}

export const DataGridTextColumn = Component<DataGridTextColumnProps>(({ field, header, children, format }) => (
	<DataGridColumn
		header={header}
		sortingField={field}
		name={field}
		children={children ?? <Field field={field} format={format} />}
	/>
))

export type DataGridBooleanColumnProps = {
	field: string
	header: ReactNode
	children?: ReactNode
	format?: (value: boolean | null) => ReactNode
}

export const DataGridBooleanColumn = Component<DataGridBooleanColumnProps>(({ field, header, children, format }) => (
	<DataGridColumn
		header={header}
		sortingField={field}
		name={field}
		children={children ?? <Field field={field} format={format ?? formatBoolean} />}
	/>
))

export type DataGridNumberColumnProps = {
	field: string
	header: ReactNode
	children?: ReactNode
	format?: (value: number | null) => ReactNode
}

export const DataGridNumberColumn = Component<DataGridNumberColumnProps>(({ field, header, children, format }) => (
	<DataGridColumn
		header={header}
		sortingField={field}
		name={field}
		children={children ?? <Field field={field} format={format ?? formatNumber} />}
	/>
))

export type DataGridDateColumnProps = {
	field: string
	header: ReactNode
	children?: ReactNode
	format?: (value: string | null) => ReactNode
}

export const DataGridDateColumn = Component<DataGridDateColumnProps>(({ field, header, children, format }) => (
	<DataGridColumn
		header={header}
		sortingField={field}
		name={field}
		children={children ?? <Field field={field} format={format ?? formatDate} />}
	/>
))


export type DataGridDateTimeColumnProps = {
	field: string
	header: ReactNode
	children?: ReactNode
	format?: (value: string | null) => ReactNode
}

export const DataGridDateTimeColumn = Component<DataGridDateTimeColumnProps>(({ field, header, children, format }) => (
	<DataGridColumn
		header={header}
		sortingField={field}
		name={field}
		children={children ?? <Field field={field} format={format ?? formatDateTime} />}
	/>
))

export type DataGridEnumColumnProps = {
	field: string
	header: ReactNode
	options: Record<string, ReactNode>
	children?: ReactNode
	tooltipActions?: ReactNode
}

export const DataGridEnumColumn = Component<DataGridEnumColumnProps>(({ field, header, options, children, tooltipActions }) => (<>
	<DataGridColumn
		header={header}
		sortingField={field}
		name={field}
		children={children ?? <DataGridEnumCell field={field} options={options} tooltipActions={tooltipActions} />}
	/>
</>))

export type DataGridHasOneColumnProps =
	& DataGridHasOneCellProps
	& {
		header: ReactNode
	}


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

export const DataGridHasOneColumn = Component<DataGridHasOneColumnProps>(({ field, header, children }) => (
	<DataGridColumn
		header={header}
		name={typeof field === 'string' ? field : undefined}
		children={<DataGridHasOneCell field={field}>{children}</DataGridHasOneCell>}
	/>
))

export type DataGridHasManyColumnProps =
	& DataGridHasManyCellProps
	& {
		header: ReactNode
	}

export const DataGridHasManyColumn = Component<DataGridHasManyColumnProps>(({ field, header, children }) => (
	<DataGridColumn
		header={header}
		name={typeof field === 'string' ? field : undefined}
		children={<DataGridHasManyCell field={field}>{children}</DataGridHasManyCell>}
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
}

export const DataGridColumn = Component<DataGridColumnProps>(({ children, header, name, hidingName, sortingField, cellClassName, headerClassName }) => {
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
						{header ? <DataGridColumnHeader hidingName={hidingName ?? name} sortingField={sortingField}>
							{header}
						</DataGridColumnHeader> : null}
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

