import { Component, QueryLanguage, SugarableRelativeSingleField } from '@contember/react-binding'
import type { ComponentType, FunctionComponent } from 'react'
import { DataGridColumn } from '../grid'
import { DataGridColumnCommonProps,  FilterRendererProps } from '../types'
import { DataViewOrderDirection, TextFilterArtifacts, createTextFilter } from '@contember/react-dataview'

export type TextCellRendererProps = {
	field: SugarableRelativeSingleField | string
}

export type TextCellProps =
	& TextCellRendererProps
	& DataGridColumnCommonProps
	& {
		disableOrder?: boolean
		initialOrder?: DataViewOrderDirection
		initialFilter?: TextFilterArtifacts
	}


export const createTextCell = <ColumnProps extends {}, ValueRendererProps extends {}>({ FilterRenderer, ValueRenderer }: {
	FilterRenderer: ComponentType<FilterRendererProps<TextFilterArtifacts>>,
	ValueRenderer: ComponentType<TextCellRendererProps & ValueRendererProps>
}): FunctionComponent<TextCellProps & ColumnProps & ValueRendererProps> => Component(props => {
	return (
		<DataGridColumn<TextFilterArtifacts>
			{...props}
			enableOrdering={!props.disableOrder as true}
			getNewFilter={createTextFilter(props.field)}
			emptyFilter={{
				mode: 'matches',
				query: '',
				nullCondition: false,
			}}
			filterRenderer={FilterRenderer}
		>
			<ValueRenderer {...props} />
		</DataGridColumn>
	)
}, 'TextCell')
