import { Component, Environment, Field, QueryLanguage, SugaredRelativeSingleField } from '@contember/binding'
import { TextInput } from '@contember/ui'
import * as React from 'react'
import { DataGridColumn, DataGridColumnProps } from '../base'

export type TextCellProps = Omit<DataGridColumnProps, 'children'> & SugaredRelativeSingleField

const getFullPath = (field: SugaredRelativeSingleField['field'], env: Environment): string[] => {
	const desugared = QueryLanguage.desugarRelativeSingleField(field, env)
	const path: string[] = desugared.hasOneRelationPath.map(item => item.field)
	path.push(desugared.field)

	return path
}

interface ContainsCIFilter {
	containsCI: string
}
interface SimpleContainsCIFilter {
	[field: string]: SimpleContainsCIFilter | ContainsCIFilter
}

export const TextCell = Component<TextCellProps>(props => {
	return (
		<DataGridColumn<SimpleContainsCIFilter>
			{...(props as any)}
			getNewOrderBy={(newDirection, { environment }) =>
				newDirection && QueryLanguage.desugarOrderBy(`${props.field as string} ${newDirection}`, environment)[0]
			}
			filterRenderer={({ filter, setFilter, environment }) => {
				const fullPath = getFullPath(props.field, environment)
				let query: string

				if (filter === undefined) {
					query = ''
				} else {
					let f: SimpleContainsCIFilter[string] = filter
					for (const field of fullPath) {
						f = (f as SimpleContainsCIFilter)[field]
					}
					query = (f as ContainsCIFilter).containsCI
				}
				return (
					<TextInput
						value={query}
						onChange={e => {
							const value = e.target.value

							if (value === '') {
								return setFilter(undefined)
							}

							let newFilter: SimpleContainsCIFilter[string] = {
								containsCI: value,
							}

							for (let i = fullPath.length - 1; i >= 0; i--) {
								newFilter = {
									[fullPath[i]]: newFilter,
								}
							}
							setFilter(newFilter as SimpleContainsCIFilter)
						}}
					/>
				)
			}}
		>
			<Field {...props} format={value => (value === null ? <i>Nothing</i> : value)} />
		</DataGridColumn>
	)
}, 'TextCell')
