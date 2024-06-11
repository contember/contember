import * as React from 'react'
import { ReactNode } from 'react'
import { DataGridEnumFieldTooltip, DataGridHasManyTooltip, DataGridHasOneTooltip } from './filters'
import { DataGridTooltipLabel } from './ui'
import { Component, Field, HasMany, HasOne, SugaredRelativeEntityList, SugaredRelativeSingleEntity, SugaredRelativeSingleField } from '@contember/interface'

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
	options: Record<string, ReactNode>
	tooltipActions?: ReactNode
}

export const DataGridEnumCell = Component(({ field, options, filterName, tooltipActions }: DataGridEnumCellProps) => {
	return (
		<Field<string> field={field} format={it => it ? (
			<DataGridEnumFieldTooltip value={it} field={field} name={filterName} actions={tooltipActions}>
				<DataGridTooltipLabel>
					{options[it]}
				</DataGridTooltipLabel>
			</DataGridEnumFieldTooltip>
		) : null} />
	)
})
