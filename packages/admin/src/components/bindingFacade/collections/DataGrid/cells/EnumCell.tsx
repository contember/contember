import { ChangeEvent, ReactNode, useCallback } from 'react'
import { DataGridColumn, DataGridColumnPublicProps } from '../base'
import { Component, QueryLanguage, SugaredField, SugaredFieldProps, wrapFilterInHasOnes } from '@contember/binding'
import { GraphQlLiteral, Input } from '@contember/client'
import { useMessageFormatter } from '../../../../../i18n'
import { dataGridCellsDictionary } from './dataGridCellsDictionary'
import { FieldFallbackView, FieldFallbackViewPublicProps } from '../../../fieldViews'
import { Checkbox, FieldContainer } from '@contember/ui'

export type EnumCellProps =
	& DataGridColumnPublicProps
	& FieldFallbackViewPublicProps
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
					(checked: boolean, value: string) => {
						if (checked) {
							setFilter({ nullCondition, values: [...values, value] })
						} else {
							setFilter({ nullCondition, values: values.filter(it => it !== value) })
						}
					},
					[nullCondition, setFilter, values],
				)

				const checkboxList = Object.entries(props.options).map(([value, label]) => (
					<FieldContainer
						key={value}
						label={label}
						labelPosition="labelInlineRight"
					>
						<Checkbox
							notNull
							value={values.includes(value)}
							onChange={checked => onChange(!!checked, value)}
						/>
					</FieldContainer>
				))
				const formatMessage = useMessageFormatter(dataGridCellsDictionary)
				if (fieldSchema?.nullable) {
					checkboxList.push(
						<FieldContainer
							key={'__null'}
							label={<i style={{ opacity: 0.8, fontWeight: 'normal' }}>
								{formatMessage('dataGridCells.enumCell.includeNull')}
							</i>}
							labelPosition="labelInlineRight"
						>
							<Checkbox
								notNull
								value={nullCondition}
								onChange={checked => {
									setFilter({
										values,
										nullCondition: !!checked,
									})
								}}
							/>
						</FieldContainer>,
					)
				}

				return <>{checkboxList}</>
			}}
		>
			<SugaredField<string> field={props.field} format={value => {
				if (value === null) {
					return <FieldFallbackView fallback={props.fallback} fallbackStyle={props.fallbackStyle} />
				}
				if (props.format) {
					return props.format(props.options[value])
				}
				return props.options[value]
			}} />
		</DataGridColumn>
	)
}, 'EnumCell')
