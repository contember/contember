import { Component, QueryLanguage, SugarableRelativeSingleField, wrapFilterInHasOnes } from '@contember/react-binding'
import type { Input } from '@contember/client'
import { ComponentType, FunctionComponent } from 'react'
import { DataGridColumnCommonProps, DataGridOrderDirection, FilterRendererProps } from '../types'
import { DataGridColumn } from '../grid'

export type DateCellRendererProps = {
	field: SugarableRelativeSingleField | string
}
export type DateCellProps =
	& DateCellRendererProps
	& DataGridColumnCommonProps
	& {
		disableOrder?: boolean
		initialOrder?: DataGridOrderDirection
		initialFilter?: DateRangeFilterArtifacts
	}

export type DateRangeFilterArtifacts = {
	start: string | null
	end: string | null
}

export const createDateCell = <ColumnProps extends {}, ValueRendererProps extends {}>({ FilterRenderer, ValueRenderer }: {
	FilterRenderer: ComponentType<FilterRendererProps<DateRangeFilterArtifacts>>,
	ValueRenderer: ComponentType<DateCellRendererProps & ValueRendererProps>
}): FunctionComponent<DateCellProps & ColumnProps & ValueRendererProps> => Component(props => {
	return (
		<DataGridColumn<DateRangeFilterArtifacts>
			{...props}
			enableOrdering={!props.disableOrder as true}
			getNewOrderBy={(newDirection, { environment }) =>
				newDirection ? QueryLanguage.desugarOrderBy(`${props.field as string} ${newDirection}`, environment) : undefined
			}
			getNewFilter={(filterArtifact, { environment }) => {
				if (!filterArtifact.start && !filterArtifact.end) {
					return undefined
				}
				const desugared = QueryLanguage.desugarRelativeSingleField(props.field, environment)

				const conditions: Input.Condition<Input.ColumnValue>[] = []

				if (filterArtifact.start) {
					conditions.push({ gte: filterArtifact.start })
				}
				if (filterArtifact.end) {
					conditions.push({ lte: filterArtifact.end })
				}

				return wrapFilterInHasOnes(desugared.hasOneRelationPath, {
					[desugared.field]: conditions.length > 1 ? { and: conditions } : conditions[0],
				})
			}}
			emptyFilter={{
				start: null,
				end: null,
			}}
			filterRenderer={FilterRenderer}
		>
			<ValueRenderer {...props} />
		</DataGridColumn>
	)
}, 'DateCell')


