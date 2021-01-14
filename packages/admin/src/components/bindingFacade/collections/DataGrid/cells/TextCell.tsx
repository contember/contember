import {
	Component,
	Environment,
	Field,
	Filter,
	HasOneRelation,
	QueryLanguage,
	SugaredRelativeSingleField,
} from '@contember/binding'
import { whereToFilter } from '@contember/client'
import { TextInput } from '@contember/ui'
import * as React from 'react'
import { DataGridColumn, DataGridOrderDirection } from '../base'

export type TextCellProps = SugaredRelativeSingleField & {
	header?: React.ReactNode
	initialOrder?: DataGridOrderDirection
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
			{...(props as any)}
			getNewOrderBy={(newDirection, { environment }) =>
				newDirection && QueryLanguage.desugarOrderBy(`${props.field as string} ${newDirection}`, environment)[0]
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
			<Field {...props} format={value => (value === null ? <i>Nothing</i> : String(value))} />
		</DataGridColumn>
	)
}, 'TextCell')
