import { ChangeEvent, ReactNode, useCallback } from 'react'
import { DataGridColumn, DataGridColumnPublicProps } from '../base'
import { Component, QueryLanguage, SugaredField, SugaredFieldProps, wrapFilterInHasOnes } from '@contember/binding'
import { GraphQlLiteral, Input } from '@contember/client'
import { useMessageFormatter } from '../../../../../i18n'
import { dataGridCellsDictionary } from './dataGridCellsDictionary'

export type EnumCellProps =
	& DataGridColumnPublicProps
	& {
		field: SugaredFieldProps['field']
		options: Record<string, string>
		format?: (value: string | null) => ReactNode
}

export type EnumCellArtifacts = {
	values: string[]
	nullCondition: boolean
}

/** @deprecated */
type LegacyEnumCellArtifacts = string[]

export const EnumCell = Component<EnumCellProps>(props => {
	return (
		<DataGridColumn<EnumCellArtifacts | LegacyEnumCellArtifacts>
			{...props}
			enableOrdering={true}
			getNewOrderBy={(newDirection, { environment }) =>
				newDirection ? QueryLanguage.desugarOrderBy(`${props.field as string} ${newDirection}`, environment) : undefined
			}
			enableFiltering={true}
			getNewFilter={(filter, { environment }) => {
				const { values, nullCondition = false } = Array.isArray(filter) ? {
					values: filter,
				} : filter

				if (values.length === 0 && !nullCondition) {
					return undefined
				}
				const desugared = QueryLanguage.desugarRelativeSingleField(props.field, environment)

				const conditions: Input.Condition<GraphQlLiteral>[] = []

				if (nullCondition) {
					conditions.push({ isNull: true })
				}

				conditions.push({
					in: values.map(it => new GraphQlLiteral(it)),
				})

				return wrapFilterInHasOnes(desugared.hasOneRelationPath, {
					[desugared.field]: { or: conditions },
				})
			}}
			emptyFilter={{ nullCondition: false, values: [] }}
			filterRenderer={({ filter, setFilter, environment }) => {
				const { values, nullCondition = false } = Array.isArray(filter) ? {
					values: filter,
				} : filter

				const desugared = QueryLanguage.desugarRelativeSingleField(props.field, environment)
				const entitySchema = environment.getSubTreeNode().entity
				const fieldSchema = entitySchema.fields.get(desugared.field)

				const onChange = useCallback(
					(event: ChangeEvent<HTMLInputElement>) => {
						if (event.target.checked) {
							setFilter({ nullCondition, values: [...values, event.target.value] })
						} else {
							setFilter({ nullCondition, values: values.filter(it => it !== event.target.value) })
						}
					},
					[nullCondition, setFilter, values],
				)

				const checkboxList = Object.entries(props.options).map(([value, label]) => (
					<label key={value} style={{ display: 'block' }}>
						<input type="checkbox" value={value} checked={values.includes(value)} onChange={onChange} />
						{label}
					</label>
				))
				const formatMessage = useMessageFormatter(dataGridCellsDictionary)
				if (fieldSchema?.nullable) {
					checkboxList.push(
						<label key={'__null'} style={{ display: 'block' }}>
							<input type="checkbox" checked={nullCondition} onChange={e => {
								setFilter({
									values,
									nullCondition: e.target.checked,
								})
							}} />
							<i style={{ opacity: 0.8 }}>
								{formatMessage('dataGridCells.enumCell.includeNull')}
							</i>
						</label>,
					)
				}

				return <>{checkboxList}</>
			}}
		>
			<SugaredField<string> field={props.field} format={value => {
				return value ? (props.format ? props.format(props.options[value]) : props.options[value]) : ''
			}} />
		</DataGridColumn>
	)
}, 'EnumCell')
