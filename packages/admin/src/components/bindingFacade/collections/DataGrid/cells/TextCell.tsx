import { Component, Field, SugaredRelativeSingleField } from '@contember/binding'
import * as React from 'react'
import { DataGridColumn, DataGridColumnProps } from '../base'

export type TextCellProps = Omit<DataGridColumnProps, 'children'> & SugaredRelativeSingleField

export const TextCell = Component<TextCellProps>(
	props => (
		<DataGridColumn>
			<Field {...props} />
		</DataGridColumn>
	),
	'TextCell',
)
