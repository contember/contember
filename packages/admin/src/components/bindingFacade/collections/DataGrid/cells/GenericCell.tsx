import { Component } from '@contember/react-binding'
import type { FunctionComponent } from 'react'
import { DataGridColumnCommonProps } from '../types'
import { DataGridColumn } from '../grid'

export type GenericCellProps = DataGridColumnCommonProps

export const createGenericCell = <ColumnProps extends {}>(): FunctionComponent<GenericCellProps & ColumnProps> => Component(props => {
	return (
		<DataGridColumn<string> {...props} enableOrdering={false} enableFiltering={false}>
			{props.children}
		</DataGridColumn>
	)
}, 'GenericCell')
