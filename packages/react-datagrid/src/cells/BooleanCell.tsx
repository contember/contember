import { Component, QueryLanguage, SugarableRelativeSingleField } from '@contember/react-binding'
import type { ComponentType, FunctionComponent } from 'react'
import { DataGridColumnCommonProps, FilterRendererProps } from '../types'
import { DataGridColumn } from '../grid'
import { BooleanFilterArtifacts, DataViewSortingDirection, createBooleanFilter } from '@contember/react-dataview'

export type BooleanCellRendererProps = {
	field: SugarableRelativeSingleField | string
}

export type BooleanCellProps =
	& DataGridColumnCommonProps
	& BooleanCellRendererProps
	& {
		disableOrder?: boolean
		initialOrder?: DataViewSortingDirection
		initialFilter?: BooleanFilterArtifacts
	}



export const createBooleanCell = <ColumnProps extends {}, ValueRendererProps extends {}>({ FilterRenderer, ValueRenderer }: {
	FilterRenderer: ComponentType<FilterRendererProps<BooleanFilterArtifacts>>,
	ValueRenderer: ComponentType<BooleanCellRendererProps & ValueRendererProps>
}): FunctionComponent<BooleanCellProps & ColumnProps & ValueRendererProps> => Component(props => {
	return (
		<DataGridColumn<BooleanFilterArtifacts>
			{...props}
			enableOrdering={!props.disableOrder as true}
			getNewFilter={createBooleanFilter(props.field)}
			emptyFilter={{}}
			filterRenderer={FilterRenderer}
		>
			<ValueRenderer {...props} />
		</DataGridColumn>
	)
}, 'BooleanCell')
