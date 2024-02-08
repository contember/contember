import { Component, QueryLanguage, SugarableRelativeSingleField } from '@contember/react-binding'
import type { ComponentType, FunctionComponent } from 'react'
import { DataGridColumnCommonProps, FilterRendererProps } from '../types'
import { DataGridColumn } from '../grid'
import { createNumberFilter, DataViewSortingDirection } from '@contember/react-dataview'

export type NumberCellRendererProps = {
	field: SugarableRelativeSingleField | string
}
export type NumberCellProps =
	& DataGridColumnCommonProps
	& NumberCellRendererProps
	& {
		disableOrder?: boolean
		initialOrder?: DataViewSortingDirection
		initialFilter?: NumberFilterArtifacts
	}

export type NumberFilterArtifacts = {
	mode: 'eq' | 'gte' | 'lte'
	query: number | null
	nullCondition: boolean
}

export const createNumberCell = <ColumnProps extends {}, ValueRendererProps extends {}, FilterProps extends {}>({ FilterRenderer, ValueRenderer }: {
	FilterRenderer: ComponentType<FilterRendererProps<NumberFilterArtifacts, FilterProps>>,
	ValueRenderer: ComponentType<NumberCellRendererProps & ValueRendererProps>
}): FunctionComponent<NumberCellProps & ColumnProps & ValueRendererProps & FilterProps> => Component(props => {
	return (
		<DataGridColumn<NumberFilterArtifacts>
			{...props}
			enableOrdering={!props.disableOrder as true}
			getNewFilter={createNumberFilter(props.field)}
			emptyFilter={{
				mode: 'eq',
				query: null,
				nullCondition: false,
			}}
			filterRenderer={filterProps => <FilterRenderer {...filterProps} {...props} />}
		>
			<ValueRenderer {...props} />
		</DataGridColumn>
	)
}, 'NumberCell')
