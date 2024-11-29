import * as React from 'react'
import { ReactNode } from 'react'
import { DataGridEnumFieldTooltip, DataGridHasManyTooltip, DataGridHasOneTooltip } from './filters'
import { DataGridTooltipLabel } from './ui'
import {
	Component,
	Field,
	FieldView,
	HasMany,
	HasOne,
	SugaredRelativeEntityList,
	SugaredRelativeSingleEntity,
	SugaredRelativeSingleField,
} from '@contember/interface'
import { useEnumOptionsFormatter } from '../labels'

export type DataGridHasOneCellProps = {
	field: SugaredRelativeSingleEntity['field']
	filterName?: string
	children: ReactNode
	tooltipActions?: ReactNode
}

export const DataGridHasOneCell = Component(({ field, filterName, children, tooltipActions }: DataGridHasOneCellProps) => {
	return (
		<HasOne field={field}>
			<DataGridHasOneTooltip field={field} actions={tooltipActions} name={filterName}>
				<DataGridTooltipLabel>
					{children}
				</DataGridTooltipLabel>
			</DataGridHasOneTooltip>
		</HasOne>
	)
})

export type DataGridHasManyCellProps = {
	field: SugaredRelativeEntityList['field']
	filterName?: string
	children: ReactNode
	tooltipActions?: ReactNode
}

export const DataGridHasManyCell = Component(({ field, filterName, children, tooltipActions }: DataGridHasManyCellProps) => {
	return (
		<div className={'flex flex-wrap gap-2'}>
			<HasMany field={field}>
				<DataGridHasManyTooltip field={field} actions={tooltipActions} name={filterName}>
					<DataGridTooltipLabel>
						{children}
					</DataGridTooltipLabel>
				</DataGridHasManyTooltip>
			</HasMany>
		</div>
	)
})

export type DataGridEnumCellProps = {
	field: SugaredRelativeSingleField['field']
	filterName?: string
	options?: Record<string, ReactNode>
	tooltipActions?: ReactNode
}

export const DataGridEnumCell = Component(({ field, options, filterName, tooltipActions }: DataGridEnumCellProps) => {
	const enumOptionsProvider = useEnumOptionsFormatter()
	return (
		<FieldView<string> field={field} render={it => {
			const resolvedOptions = options ?? enumOptionsProvider(it.schema.enumName!)
			return it.value ? (
				<DataGridEnumFieldTooltip value={it.value} field={field} name={filterName} actions={tooltipActions}>
					<DataGridTooltipLabel>
						{resolvedOptions[it.value]}
					</DataGridTooltipLabel>
				</DataGridEnumFieldTooltip>
			) : null
		}} />
	)
}, ({ field }) => <Field field={field} />, 'DataGridEnumCell')
