import { Component, QueryLanguage, SugarableRelativeSingleField } from '@contember/react-binding'
import { ComponentType, FunctionComponent } from 'react'
import { DataGridColumnCommonProps, FilterRendererProps } from '../types'
import { DataGridColumn } from '../grid'
import { createDateFilter, DataViewOrderDirection, DateRangeFilterArtifacts } from '@contember/react-dataview'

export type DateCellRendererProps = {
	field: SugarableRelativeSingleField | string
}
export type DateCellProps =
	& DateCellRendererProps
	& DataGridColumnCommonProps
	& {
		disableOrder?: boolean
		initialOrder?: DataViewOrderDirection
		initialFilter?: DateRangeFilterArtifacts
	}


export const createDateCell = <ColumnProps extends {}, ValueRendererProps extends {}>({ FilterRenderer, ValueRenderer }: {
	FilterRenderer: ComponentType<FilterRendererProps<DateRangeFilterArtifacts>>,
	ValueRenderer: ComponentType<DateCellRendererProps & ValueRendererProps>
}): FunctionComponent<DateCellProps & ColumnProps & ValueRendererProps> => Component(props => {
	return (
		<DataGridColumn<DateRangeFilterArtifacts>
			{...props}
			enableOrdering={!props.disableOrder as true}
			getNewFilter={createDateFilter(props.field)}
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


