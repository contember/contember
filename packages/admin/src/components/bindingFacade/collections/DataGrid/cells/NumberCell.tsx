import { Component, QueryLanguage, SugarableRelativeSingleField, wrapFilterInHasOnes } from '@contember/react-binding'
import { Input } from '@contember/client'
import type { ComponentType, FunctionComponent } from 'react'
import { DataGridColumnCommonProps, DataGridOrderDirection, FilterRendererProps } from '../types'
import { DataGridColumn } from '../grid'

export type NumberCellRendererProps = {
	field: SugarableRelativeSingleField | string
}
export type NumberCellProps =
	& DataGridColumnCommonProps
	& NumberCellRendererProps
	& {
		disableOrder?: boolean
		initialOrder?: DataGridOrderDirection
		initialFilter?: NumberFilterArtifacts
	}

export type NumberFilterArtifacts = {
	mode: 'eq' | 'gte' | 'lte'
	query: number | null
	nullCondition: boolean
}

export const createNumberCell = <ColumnProps extends {}, ValueRendererProps extends {}, FilterProps extends {}>({ FilterRenderer, ValueRenderer }: {
	FilterRenderer: ComponentType<FilterRendererProps<NumberFilterArtifacts, FilterProps>>,
	ValueRenderer: ComponentType<NumberCellRendererProps & ValueRendererProps>
}): FunctionComponent<NumberCellProps & ColumnProps & ValueRendererProps & FilterProps> => Component(props => {
	return (
		<DataGridColumn<NumberFilterArtifacts>
			{...props}
			enableOrdering={!props.disableOrder as true}
			getNewOrderBy={(newDirection, { environment }) =>
				newDirection ? QueryLanguage.desugarOrderBy(`${props.field as string} ${newDirection}`, environment) : undefined
			}
			getNewFilter={(filter, { environment }) => {
				if (filter.query === null && !filter.nullCondition) {
					return undefined
				}

				const baseOperators = {
					eq: 'eq',
					gte: 'gte',
					lte: 'lte',
				}

				const conditions: Input.Condition[] = []
				if (filter.query !== null) {
					conditions.push({
						[baseOperators[filter.mode]]: filter.query,
					})
				}
				if (filter.nullCondition) {
					conditions.push({ isNull: true })
				}

				const desugared = QueryLanguage.desugarRelativeSingleField(props, environment)
				return wrapFilterInHasOnes(desugared.hasOneRelationPath, {
					[desugared.field]: { or: conditions },
				})
			}}
			emptyFilter={{
				mode: 'eq',
				query: null,
				nullCondition: false,
			}}
			filterRenderer={filterProps => <FilterRenderer {...filterProps} {...props} />}
		>
			<ValueRenderer {...props} />
		</DataGridColumn>
	)
}, 'NumberCell')
