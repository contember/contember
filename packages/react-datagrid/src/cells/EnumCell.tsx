import { ComponentType, FunctionComponent, ReactNode } from 'react'
import { Component, QueryLanguage, SugarableRelativeSingleField } from '@contember/react-binding'
import { DataGridColumnCommonProps, FilterRendererProps } from '../types'
import { DataGridColumn } from '../grid'
import { EnumCellFilterArtifacts, createEnumFilter } from '@contember/react-dataview'

export type EnumCellRendererProps = {
	field: SugarableRelativeSingleField | string
}

export type EnumCellProps =
	& DataGridColumnCommonProps
	& EnumCellRendererProps
	& {
		options: Record<string, string>
		format?: (value: string | null) => ReactNode
		initialFilter?: EnumCellFilterArtifacts
	}



export const createEnumCell = <ColumnProps extends {}, ValueRendererProps extends {}, FilterProps extends {}>({ FilterRenderer, ValueRenderer }: {
	FilterRenderer: ComponentType<FilterRendererProps<EnumCellFilterArtifacts, FilterProps>>,
	ValueRenderer: ComponentType<EnumCellRendererProps & ValueRendererProps>
}): FunctionComponent<EnumCellProps & ColumnProps & ValueRendererProps & FilterProps> => Component(props => {
	return (
		<DataGridColumn<EnumCellFilterArtifacts>
			{...props}
			enableOrdering={true}
			enableFiltering={true}
			getNewFilter={createEnumFilter(props.field)}
			emptyFilter={{ nullCondition: false, values: [] }}
			filterRenderer={filterProps => <FilterRenderer {...filterProps} {...props} />}
		>
			<ValueRenderer {...props} />
		</DataGridColumn>
	)
}, 'EnumCell')
