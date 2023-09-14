import { Component, QueryLanguage, SugarableRelativeSingleField, wrapFilterInHasOnes } from '@contember/react-binding'
import type { ComponentType, FunctionComponent } from 'react'
import { DataGridColumn } from '../grid'
import { DataGridColumnCommonProps, DataGridOrderDirection, FilterRendererProps } from '../types'
import { createGenericTextCellFilterCondition } from './common'

export type TextCellRendererProps = {
	field: SugarableRelativeSingleField | string
}

export type TextCellProps =
	& TextCellRendererProps
	& DataGridColumnCommonProps
	& {
		disableOrder?: boolean
		initialOrder?: DataGridOrderDirection
		initialFilter?: TextFilterArtifacts
	}

export type TextFilterArtifacts = {
	mode: 'matches' | 'matchesExactly' | 'startsWith' | 'endsWith' | 'doesNotMatch'
	query: string
	nullCondition: boolean
}

export const createTextCell = <ColumnProps extends {}, ValueRendererProps extends {}>({ FilterRenderer, ValueRenderer }: {
	FilterRenderer: ComponentType<FilterRendererProps<TextFilterArtifacts>>,
	ValueRenderer: ComponentType<TextCellRendererProps & ValueRendererProps>
}): FunctionComponent<TextCellProps & ColumnProps & ValueRendererProps> => Component(props => {
	return (
		<DataGridColumn<TextFilterArtifacts>
			{...props}
			enableOrdering={!props.disableOrder as true}
			getNewOrderBy={(newDirection, { environment }) =>
				newDirection ? QueryLanguage.desugarOrderBy(`${props.field as string} ${newDirection}`, environment) : undefined
			}
			getNewFilter={(filter, { environment }) => {
				if (filter.query === '' && filter.nullCondition === false) {
					return undefined
				}

				let condition = filter.query !== '' ? createGenericTextCellFilterCondition(filter) : {}

				if (filter.mode === 'doesNotMatch') {
					if (filter.nullCondition) {
						condition = {
							and: [condition, { isNull: false }],
						}
					}
				} else if (filter.nullCondition) {
					condition = {
						or: [condition, { isNull: true }],
					}
				}

				const desugared = QueryLanguage.desugarRelativeSingleField(props.field, environment)
				return wrapFilterInHasOnes(desugared.hasOneRelationPath, {
					[desugared.field]: condition,
				})
			}}
			emptyFilter={{
				mode: 'matches',
				query: '',
				nullCondition: false,
			}}
			filterRenderer={FilterRenderer}
		>
			<ValueRenderer {...props} />
		</DataGridColumn>
	)
}, 'TextCell')
