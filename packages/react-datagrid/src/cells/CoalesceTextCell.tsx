import { Component, SugarableRelativeSingleField } from '@contember/react-binding'
import { ComponentType, FunctionComponent } from 'react'
import { DataGridColumnCommonProps, FilterRendererProps } from '../types'
import { DataGridColumn } from '../grid'
import { TextFilterArtifacts, createUnionTextFilter } from '@contember/react-dataview'

export type CoalesceCellRendererProps = {
	fields: (SugarableRelativeSingleField | string)[]
	initialFilter?: TextFilterArtifacts
}

export type CoalesceTextCellProps =
	& DataGridColumnCommonProps
	& CoalesceCellRendererProps
	& {
		initialFilter?: TextFilterArtifacts
	}


export const createCoalesceTextCell = <ColumnProps extends {}, ValueRendererProps extends {}>({ FilterRenderer, ValueRenderer }: {
	FilterRenderer: ComponentType<FilterRendererProps<TextFilterArtifacts>>,
	ValueRenderer: ComponentType<CoalesceCellRendererProps & ValueRendererProps>
}): FunctionComponent<CoalesceTextCellProps & ColumnProps & ValueRendererProps> => Component(props => {
	return (
		<DataGridColumn<TextFilterArtifacts>
			{...props}
			enableOrdering={false}
			getNewFilter={createUnionTextFilter(props.fields)}
			emptyFilter={{
				mode: 'matches',
				query: '',
			}}
			filterRenderer={FilterRenderer}
		>
			<ValueRenderer {...props} />
		</DataGridColumn>
	)
}, 'CoalesceTextCell')
