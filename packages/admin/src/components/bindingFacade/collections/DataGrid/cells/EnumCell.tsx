import { ReactNode, useMemo } from 'react'
import { DataGridColumn, DataGridColumnPublicProps } from '../base'
import { Component, QueryLanguage, SugaredField, SugaredFieldProps, wrapFilterInHasOnes } from '@contember/binding'
import { GraphQlLiteral, Input } from '@contember/client'
import { FieldFallbackView, FieldFallbackViewPublicProps } from '../../../fieldViews'
import { Checkbox, FieldContainer } from '@contember/ui'
import { NullConditionFilter, NullConditionFilterPublicProps } from './NullConditionFilter'

export type EnumCellProps =
	& DataGridColumnPublicProps
	& FieldFallbackViewPublicProps
	& NullConditionFilterPublicProps
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
			filterRenderer={({ filter: inFilter, setFilter, environment }) => {
				const filter = useMemo(() => Array.isArray(inFilter) ? { nullCondition: false, values: inFilter } : inFilter, [inFilter])
				const values = filter.values

				const checkboxList = Object.entries(props.options).map(([value, label]) => (
					<FieldContainer
						key={value}
						label={label}
						labelPosition="labelInlineRight"
					>
						<Checkbox
							notNull
							value={values.includes(value)}
							onChange={checked => {
								setFilter({ ...filter, values: checked ? [...values, value] : values.filter(it => it !== value) })
							}}
						/>
					</FieldContainer>
				))

				return <>
					{checkboxList}
					<NullConditionFilter filter={filter} setFilter={setFilter} environment={environment} field={props.field} showNullConditionFilter={props.showNullConditionFilter} />
				</>
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
