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

/**
 * Props for {@link DataGridHasOneCell}.
 */
export type DataGridHasOneCellProps = {

	/**
	* Has-one field to be displayed.
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
	 * Custom actions to be displayed in the tooltip.
	 */
	tooltipActions?: ReactNode
}

/**
 * Renders a cell with a has-one relation.
 * Contains a tooltip with filter actions.
 */
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

/**
 * Props for {@link DataGridHasManyCell}.
 */
export type DataGridHasManyCellProps = {
	/**
	 * Has-many field to be displayed.
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
	 * Custom actions to be displayed in the tooltip.
	 */
	tooltipActions?: ReactNode
}

/**
 * Renders a cell with a has-many relation.
 * Contains a tooltip with filter actions.
 */
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

/**
 * Props for {@link DataGridEnumCell}.
 */
export type DataGridEnumCellProps = {
	/**
	 * Field to be displayed.
	 */
	field: SugaredRelativeSingleField['field']

	/**
	 * Filter identifier. If not provided, the filter is resolved from the field name.
	 */
	filterName?: string

	/**
	 * Enum options to be displayed in the tooltip. If not provided, the options are resolved from the enum.
	 */
	options?: Record<string, ReactNode>
	/**
	 * Custom actions to be displayed in the tooltip.
	 */
	tooltipActions?: ReactNode
}

/**
 * Renders a cell with an enum value.
 * Contains a tooltip with filter actions.
 */
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
