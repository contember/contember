import { Component, Environment, Field, QueryLanguage, SugaredRelativeSingleField } from '@contember/binding'
import * as React from 'react'
import { DataGridColumn, DataGridColumnProps } from '../base'

export type TextCellProps = Omit<DataGridColumnProps, 'children'> & SugaredRelativeSingleField

export const TextCell = Component<TextCellProps>(
	props => (
		<DataGridColumn
			{...(props as any)}
			getNewOrderBy={newDirection =>
				newDirection && QueryLanguage.desugarOrderBy(`${props.field as string} ${newDirection}`, new Environment())[0]
			}
		>
			<Field {...props} format={value => (value === null ? <i>Nothing</i> : value)} />
		</DataGridColumn>
	),
	'TextCell',
)
