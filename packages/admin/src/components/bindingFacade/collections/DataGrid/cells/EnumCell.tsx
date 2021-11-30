import { ChangeEvent, useCallback } from 'react'
import { DataGridCellPublicProps, DataGridColumn } from '../base'
import { Component, QueryLanguage, SugaredField, SugaredFieldProps, wrapFilterInHasOnes } from '@contember/binding'

export type EnumCellProps =
	& DataGridCellPublicProps
	& {
		field: SugaredFieldProps['field']
		options: Record<string, string>
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
						in: filterArtefact,
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
			<SugaredField<string> field={props.field} format={value => (value ? props.options[value] : '')} />
		</DataGridColumn>
	)
}, 'EnumCell')
