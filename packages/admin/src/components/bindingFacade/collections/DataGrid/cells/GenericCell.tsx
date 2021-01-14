import { Component } from '@contember/binding'
import * as React from 'react'
import { DataGridCellPublicProps, DataGridColumn, DataGridHeaderCellPublicProps } from '../base'

export type GenericCellProps = DataGridHeaderCellPublicProps &
	DataGridCellPublicProps & {
		children: React.ReactNode
	}

export const GenericCell = Component<GenericCellProps>(props => {
	return (
		<DataGridColumn<string> {...props} enableOrdering={false} enableFiltering={false}>
			{props.children}
		</DataGridColumn>
	)
}, 'GenericCell')
