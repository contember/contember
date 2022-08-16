import { ChangeEvent, ReactNode, useCallback } from 'react'
import { DataGridColumn, DataGridColumnPublicProps } from '../base'
import { Component, QueryLanguage, SugaredField, SugaredFieldProps, wrapFilterInHasOnes } from '@contember/binding'
import { GraphQlLiteral } from '@contember/client'

export type EnumCellProps =
	& DataGridColumnPublicProps
	& {
		field: SugaredFieldProps['field']
		options: Record<string, string>
		format?: (value: string | null) => ReactNode
}

export const EnumCell = Component<EnumCellProps>(props => {
	return (
		<DataGridColumn<string[]>
			{...props}
			enableOrdering={true}
			getNewOrderBy={(newDirection, { environment }) =>
				newDirection ? QueryLanguage.desugarOrderBy(`${props.field as string} ${newDirection}`, environment) : undefined
			}
			enableFiltering={true}
			getNewFilter={(filterArtefact, { environment }) => {
				if (filterArtefact.length === 0) {
					return undefined
				}
				const desugared = QueryLanguage.desugarRelativeSingleField(props.field, environment)
				return wrapFilterInHasOnes(desugared.hasOneRelationPath, {
					[desugared.field]: {
						in: filterArtefact.map(it => new GraphQlLiteral(it)),
					},
				})
			}}
			emptyFilter={[]}
			filterRenderer={({ filter, setFilter, environment }) => {
				const onChange = useCallback(
					(event: ChangeEvent<HTMLInputElement>) => {
						if (event.target.checked) {
							setFilter([...filter, event.target.value])
						} else {
							setFilter(filter.filter(it => it !== event.target.value))
						}
					},
					[filter, setFilter],
				)

				const checkboxList = Object.entries(props.options).map(([value, label]) => (
					<label key={value} style={{ display: 'block' }}>
						<input type="checkbox" value={value} checked={filter.includes(value)} onChange={onChange} />
						{label}
					</label>
				))

				return <>{checkboxList}</>
			}}
		>
			<SugaredField<string> field={props.field} format={value => {
				return value ? (props.format ? props.format(props.options[value]) : props.options[value]) : ''
			}} />
		</DataGridColumn>
	)
}, 'EnumCell')
