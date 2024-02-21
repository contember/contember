import * as React from 'react'
import { ReactNode } from 'react'
import {
	DataViewEnumFieldTooltip,
	DataViewRelationFieldTooltip,
	DataViewTextFilter,
	DefaultDataViewEnumFilter,
	DefaultDataViewNumberFilter,
	DefaultDataViewRelationFilter,
} from './filters'
import { formatBoolean, formatDate, formatNumber } from '../../../lib/utils/formatting'
import { DataViewColumn } from './grid'
import { Field, HasMany, HasOne } from '@contember/react-binding'
import {
	createBooleanFilter,
	createDateFilter,
	createEnumFilter,
	createHasOneFilter,
	createNumberRangeFilter,
	createTextFilter,
	DataViewFilterHandler,
} from '@contember/react-dataview'
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

export const createTextColumn = ({ field, label, ...args }: DataViewTextColumnArgs): DataViewColumn => {

	return {
		filterName: field,
		cell: <Field field={field} />,
		header: label,
		hidingName: field,
		sortingField: field,
		filterHandler: createTextFilter(field),
		filterToolbar: <DataViewTextFilter name={field} />,
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

export const createHasOneColumn = ({ field, label, tooltipActions, filterOptions, valueField, value, filterLabel, filterField, filterOption, ...args }: DataViewHasOneColumnArgs): DataViewColumn => {

	value ??= valueField ? <Field field={valueField} /> : null
	filterOption ??= value

	return {
		filterName: field,
		cell: (
			<div className={'-mx-3'}>
				<HasOne field={field}>
					<DataViewRelationFieldTooltip filter={args.filterName ?? field} actions={tooltipActions}>
						{value}
					</DataViewRelationFieldTooltip>
				</HasOne>
			</div>
		),
		header: label,
		hidingName: field,
		sortingField: valueField ? field + '.' + valueField : undefined,
		filterHandler: createHasOneFilter(field),
		filterToolbar: filterOptions && (
			<DefaultDataViewRelationFilter
				name={field}
				options={filterOptions}
				label={filterLabel ?? label}
				filterField={filterField ?? valueField}
			>
				{filterOption}
			</DefaultDataViewRelationFilter>
		),
		...args,
	}
}

export type DataViewHasManyColumnArgs =
	& DataViewColumnCommonArgs
	& DataViewRelationColumnArgs


export const createHasManyColumn = ({ field, label, tooltipActions, filterOptions, valueField, value, filterLabel, filterField, filterOption, ...args }: DataViewHasManyColumnArgs): DataViewColumn => {
	value ??= <Field field="name" />
	filterOption ??= value
	return {
		filterName: field,
		cell: (
			<div className={'-mx-3'}>
				<HasMany field={field}>
					<DataViewRelationFieldTooltip filter={args.filterName ?? field} actions={tooltipActions}>
						{value}
					</DataViewRelationFieldTooltip>
				</HasMany>
			</div>
		),
		header: label,
		hidingName: field,
		filterHandler: createHasOneFilter(field),
		filterToolbar: filterOptions && (
			<DefaultDataViewRelationFilter
				name={field}
				options={filterOptions}
				label={filterLabel ?? label}
				filterField={filterField ?? valueField}
			>
				{filterOption}
			</DefaultDataViewRelationFilter>
		),
		...args,
	}
}

export type DataViewNumberColumnArgs =
	& DataViewColumnCommonArgs
	& {
		sortingField?: string
	}

export const createNumberColumn = ({ field, label, ...args }: DataViewNumberColumnArgs): DataViewColumn => {
	return {
		filterName: field,
		cell: <Field field={field} format={formatNumber} />,
		header: label,
		hidingName: field,
		sortingField: field,
		filterHandler: createNumberRangeFilter(field),
		filterToolbar: <DefaultDataViewNumberFilter name={field} label={label} />,
		...args,
	}
}

export type DataViewDateColumnArgs =
	& DataViewColumnCommonArgs
	& {
		sortingField?: string
	}

export const createDateColumn = ({ field, label, ...args }: DataViewDateColumnArgs): DataViewColumn => {
	return {
		filterName: field,
		cell: <Field field={field} format={formatDate} />,
		header: label,
		hidingName: field,
		sortingField: field,
		filterHandler: createDateFilter(field),
		...args,
	}
}

export type DataViewBooleanColumnArgs =
	& DataViewColumnCommonArgs
	& {
		sortingField?: string
	}

export const createBooleanColumn = ({ field, label, ...args }: DataViewBooleanColumnArgs): DataViewColumn => {

	return {
		filterName: field,
		cell: <Field field={field} format={formatBoolean} />,
		header: label,
		hidingName: field,
		sortingField: field,
		filterHandler: createBooleanFilter(field),
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

export const createEnumColumn = ({ field, label, options, filterLabel, ...args }: DataViewEnumColumnArgs): DataViewColumn => {
	return {
		filterName: field,
		cell: (
			<div className={'-mx-3'}>
				<Field<string> field={field} format={it => it ? (
					<DataViewEnumFieldTooltip value={it} filter={args.filterName ?? field}>
						{options[it]}
					</DataViewEnumFieldTooltip>
				) : null}
				/>
			</div>),
		header: label,
		hidingName: field,
		sortingField: field,
		filterHandler: createEnumFilter(field),
		filterToolbar: (
			<DefaultDataViewEnumFilter
				name={field}
				label={filterLabel ?? label}
				options={options}
			/>
		),
		...args,
	}
}
export const DataViewColumns = {
	text: createTextColumn,
	number: createNumberColumn,
	date: createDateColumn,
	boolean: createBooleanColumn,
	hasOne: createHasOneColumn,
	hasMany: createHasManyColumn,
	enum: createEnumColumn,
}
