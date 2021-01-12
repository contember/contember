import { Component, Field, QueryLanguage, SugaredRelativeSingleField } from '@contember/binding'
import * as React from 'react'
import { DataGridColumn, DataGridColumnProps } from '../base'

export type TextCellProps = Omit<DataGridColumnProps, 'children'> & SugaredRelativeSingleField

export const TextCell = Component<TextCellProps>(
	props => <Field {...props} format={value => (value === null ? <i>Nothing</i> : value)} />,
	(props, env) => (
		<DataGridColumn
			{...(props as any)}
			getNewOrderBy={newDirection =>
				newDirection && QueryLanguage.desugarOrderBy(`${props.field as string} ${newDirection}`, env)[0]
			}
		>
			<Field {...props} />
		</DataGridColumn>
	),
	'TextCell',
)
