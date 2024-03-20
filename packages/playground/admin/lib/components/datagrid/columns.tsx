import * as React from 'react'
import { ReactNode } from 'react'
import { DataGridBooleanFilter, DataGridDateFilter, DataGridEnumFieldTooltip, DataGridEnumFilter, DataGridNumberFilter, DataGridRelationFieldTooltip, DataGridRelationFilter, DataGridTextFilter } from './filters'
import { formatBoolean, formatDate, formatNumber } from '../../utils/formatting'
import { DataGridColumn } from './grid'
import { Field, HasMany, HasOne } from '@contember/react-binding'
import { createBooleanFilter, createDateFilter, createEnumFilter, createHasManyFilter, createHasOneFilter, createNumberRangeFilter, createTextFilter, DataViewFilterHandler } from '@contember/react-dataview'
import { SugaredQualifiedEntityList } from '@contember/interface'

export interface DataViewColumnCommonArgs {
	field: string
	label: ReactNode

	filterName?: string
	filterHandler?: DataViewFilterHandler<any>
	filterToolbar?: ReactNode
	hidingName?: string
	cell?: ReactNode
}

export type DataViewTextColumnArgs =
	& DataViewColumnCommonArgs
	& {
		sortingField?: string
	}

export const createTextColumn = ({ field, label, ...args }: DataViewTextColumnArgs): DataGridColumn => {

	return {
		type: 'text',
		field,
		filterName: field,
		cell: <Field field={field} />,
		header: label,
		hidingName: field,
		sortingField: field,
		filterHandler: createTextFilter(field),
		...args,
	}
}

export type DataViewRelationColumnArgs =
	& {
		valueField?: string
		value?: ReactNode
		filterOptions?: SugaredQualifiedEntityList['entities']
		filterLabel?: ReactNode
		filterField?: string
		filterOption?: ReactNode
		tooltipActions?: ReactNode
	}

export type DataViewHasOneColumnArgs =
	& DataViewColumnCommonArgs
	& DataViewRelationColumnArgs
	& {
		sortingField?: string
	}

export const createHasOneColumn = ({ field, label, tooltipActions, filterOptions, valueField, value, filterLabel, filterField, filterOption, ...args }: DataViewHasOneColumnArgs): DataGridColumn => {

	value ??= valueField ? <Field field={valueField} /> : null
	filterOption ??= value

	return {
		type: 'hasOne',
		field,
		filterName: field,
		cell: (
			<div className={'-mx-3'}>
				<HasOne field={field}>
					<DataGridRelationFieldTooltip filter={args.filterName ?? field} actions={tooltipActions}>
						{value}
					</DataGridRelationFieldTooltip>
				</HasOne>
			</div>
		),
		header: label,
		hidingName: field,
		sortingField: valueField ? field + '.' + valueField : undefined,
		filterHandler: createHasOneFilter(field),
		filterToolbar: filterOptions && (
			<DataGridRelationFilter
				name={field}
				options={filterOptions}
				label={filterLabel ?? label}
				filterField={filterField ?? valueField}
			>
				{filterOption}
			</DataGridRelationFilter>
		),
		...args,
	}
}

export type DataViewHasManyColumnArgs =
	& DataViewColumnCommonArgs
	& DataViewRelationColumnArgs


export const createHasManyColumn = ({ field, label, tooltipActions, filterOptions, valueField, value, filterLabel, filterField, filterOption, ...args }: DataViewHasManyColumnArgs): DataGridColumn => {
	value ??= valueField ? <Field field={valueField} /> : null
	filterOption ??= value
	return {
		type: 'hasMany',
		field,
		filterName: field,
		cell: (
			<div className={'-mx-3'}>
				<HasMany field={field}>
					<DataGridRelationFieldTooltip filter={args.filterName ?? field} actions={tooltipActions}>
						{value}
					</DataGridRelationFieldTooltip>
				</HasMany>
			</div>
		),
		header: label,
		hidingName: field,
		filterHandler: createHasManyFilter(field),
		filterToolbar: filterOptions && (
			<DataGridRelationFilter
				name={field}
				options={filterOptions}
				label={filterLabel ?? label}
				filterField={filterField ?? valueField}
			>
				{filterOption}
			</DataGridRelationFilter>
		),
		...args,
	}
}

export type DataViewNumberColumnArgs =
	& DataViewColumnCommonArgs
	& {
		sortingField?: string
	}

export const createNumberColumn = ({ field, label, ...args }: DataViewNumberColumnArgs): DataGridColumn => {
	return {
		type: 'number',
		field,
		filterName: field,
		cell: <Field field={field} format={formatNumber} />,
		header: label,
		hidingName: field,
		sortingField: field,
		filterHandler: createNumberRangeFilter(field),
		filterToolbar: <DataGridNumberFilter name={field} label={label} />,
		...args,
	}
}

export type DataViewDateColumnArgs =
	& DataViewColumnCommonArgs
	& {
		sortingField?: string
	}

export const createDateColumn = ({ field, label, ...args }: DataViewDateColumnArgs): DataGridColumn => {
	return {
		type: 'date',
		field,
		filterName: field,
		cell: <Field field={field} format={formatDate} />,
		header: label,
		hidingName: field,
		sortingField: field,
		filterHandler: createDateFilter(field),
		filterToolbar: <DataGridDateFilter name={field} label={label} />,
		...args,
	}
}

export type DataViewBooleanColumnArgs =
	& DataViewColumnCommonArgs
	& {
		sortingField?: string
	}

export const createBooleanColumn = ({ field, label, ...args }: DataViewBooleanColumnArgs): DataGridColumn => {

	return {
		type: 'boolean',
		field,
		filterName: field,
		cell: <Field field={field} format={formatBoolean} />,
		header: label,
		hidingName: field,
		sortingField: field,
		filterHandler: createBooleanFilter(field),
		filterToolbar: <DataGridBooleanFilter name={field} label={label} />,
		...args,
	}
}

export type DataViewEnumColumnArgs =
	& DataViewColumnCommonArgs
	& {
		sortingField?: string
		options: Record<string, ReactNode>
		filterLabel?: ReactNode
	}

export const createEnumColumn = ({ field, label, options, filterLabel, ...args }: DataViewEnumColumnArgs): DataGridColumn => {
	return {
		type: 'enum',
		field,
		filterName: field,
		cell: (
			<div className={'-mx-3'}>
				<Field<string> field={field} format={it => it ? (
					<DataGridEnumFieldTooltip value={it} filter={args.filterName ?? field}>
						{options[it]}
					</DataGridEnumFieldTooltip>
				) : null}
				/>
			</div>),
		header: label,
		hidingName: field,
		sortingField: field,
		filterHandler: createEnumFilter(field),
		filterToolbar: (
			<DataGridEnumFilter
				name={field}
				label={filterLabel ?? label}
				options={options}
			/>
		),
		...args,
	}
}
export const DataGridColumns = {
	text: createTextColumn,
	number: createNumberColumn,
	date: createDateColumn,
	boolean: createBooleanColumn,
	hasOne: createHasOneColumn,
	hasMany: createHasManyColumn,
	enum: createEnumColumn,
}
