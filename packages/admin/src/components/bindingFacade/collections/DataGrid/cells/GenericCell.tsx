import { Component } from '@contember/binding'
import type { FunctionComponent } from 'react'
import { DataGridColumn, DataGridColumnPublicProps } from '../base'

export type GenericCellProps = DataGridColumnPublicProps

export const GenericCell: FunctionComponent<GenericCellProps> = Component(props => {
	return (
		<DataGridColumn<string> {...props} enableOrdering={false} enableFiltering={false}>
			{props.children}
		</DataGridColumn>
	)
}, 'GenericCell')
