import { Component, SugarableRelativeSingleField } from '@contember/react-binding'
import { ComponentType, FunctionComponent } from 'react'
import { DataGridColumnCommonProps, FilterRendererProps } from '../types'
import { DataGridColumn } from '../grid'
import { CoalesceTextFilterArtifacts, createCoalesceFilter } from '@contember/react-dataview'

export type CoalesceCellRendererProps = {
	fields: (SugarableRelativeSingleField | string)[]
	initialFilter?: CoalesceTextFilterArtifacts
}

export type CoalesceTextCellProps =
	& DataGridColumnCommonProps
	& CoalesceCellRendererProps
	& {
		initialFilter?: CoalesceTextFilterArtifacts
	}


export const createCoalesceTextCell = <ColumnProps extends {}, ValueRendererProps extends {}>({ FilterRenderer, ValueRenderer }: {
	FilterRenderer: ComponentType<FilterRendererProps<CoalesceTextFilterArtifacts>>,
	ValueRenderer: ComponentType<CoalesceCellRendererProps & ValueRendererProps>
}): FunctionComponent<CoalesceTextCellProps & ColumnProps & ValueRendererProps> => Component(props => {
	return (
		<DataGridColumn<CoalesceTextFilterArtifacts>
			{...props}
			enableOrdering={false}
			getNewFilter={createCoalesceFilter(props.fields)}
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
