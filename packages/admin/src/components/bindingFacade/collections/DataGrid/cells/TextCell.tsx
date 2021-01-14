import {
	Component,
	Field,
	FieldValue,
	Filter,
	HasOneRelation,
	QueryLanguage,
	SugaredRelativeSingleField,
} from '@contember/binding'
import { whereToFilter } from '@contember/client'
import { TextInput } from '@contember/ui'
import * as React from 'react'
import { DataGridColumn, DataGridOrderDirection } from '../base'

export type TextCellProps<Persisted extends FieldValue = FieldValue> = SugaredRelativeSingleField & {
	header?: React.ReactNode
	initialOrder?: DataGridOrderDirection
	disableOrder?: boolean
	format?: (value: Persisted) => React.ReactNode
	fallback?: React.ReactNode
}

// Literal

const wrapFilter = (path: HasOneRelation[], filter: Filter): Filter => {
	for (let i = path.length - 1; i >= 0; i--) {
		const current = path[i]

		if (current.reducedBy === undefined) {
			filter = {
				[current.field]: filter,
			}
		} else {
			filter = {
				[current.field]: {
					and: [filter, whereToFilter(current.reducedBy)],
				},
			}
		}
	}
	return filter
}

export const TextCell = Component<TextCellProps>(props => {
	return (
		<DataGridColumn<string>
			header={props.header}
			enableOrdering={!props.disableOrder as true}
			initialOrder={props.initialOrder}
			getNewOrderBy={(newDirection, { environment }) =>
				newDirection && QueryLanguage.desugarOrderBy(`${props.field as string} ${newDirection}`, environment)
			}
			getNewFilter={(filterArtifact, { environment }) => {
				const desugared = QueryLanguage.desugarRelativeSingleField(props, environment)
				return wrapFilter(desugared.hasOneRelationPath, {
					[desugared.field]: {
						containsCI: filterArtifact,
					},
				})
			}}
			filterRenderer={({ filter, setFilter }) => (
				<TextInput
					value={filter ?? ''}
					onChange={e => {
						const value = e.currentTarget.value
						setFilter(value === '' ? undefined : value)
					}}
				/>
			)}
		>
			<Field
				{...props}
				format={value => {
					if (props.fallback !== undefined && value === null) {
						return props.fallback
					}
					if (props.format) {
						return props.format(value)
					}
					return value === null ? <i style={{ opacity: 0.4, fontSize: '0.75em' }}>N/A</i> : value
				}}
			/>
		</DataGridColumn>
	)
}, 'TextCell') as <Persisted extends FieldValue = FieldValue>(props: TextCellProps<Persisted>) => React.ReactElement
