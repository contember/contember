import { Component, QueryLanguage, SugarableRelativeSingleField, wrapFilterInHasOnes } from '@contember/react-binding'
import type { Input } from '@contember/client'
import type { ComponentType, FunctionComponent } from 'react'
import { DataGridColumnCommonProps, DataGridOrderDirection, FilterRendererProps } from '../types'
import { DataGridColumn } from '../grid'

export type BooleanCellRendererProps = {
	field: SugarableRelativeSingleField | string
}

export type BooleanCellProps =
	& DataGridColumnCommonProps
	& BooleanCellRendererProps
	& {
		disableOrder?: boolean
		initialOrder?: DataGridOrderDirection
		initialFilter?: BooleanFilterArtifacts
	}

export type BooleanFilterArtifacts = {
	includeTrue: boolean
	includeFalse: boolean
	includeNull: boolean
}

export const createBooleanCell = <ColumnProps extends {}, ValueRendererProps extends {}>({ FilterRenderer, ValueRenderer }: {
	FilterRenderer: ComponentType<FilterRendererProps<BooleanFilterArtifacts>>,
	ValueRenderer: ComponentType<BooleanCellRendererProps & ValueRendererProps>
}): FunctionComponent<BooleanCellProps & ColumnProps & ValueRendererProps> => Component(props => {
	return (
		<DataGridColumn<BooleanFilterArtifacts>
			{...props}
			enableOrdering={!props.disableOrder as true}
			getNewOrderBy={(newDirection, { environment }) =>
				newDirection ? QueryLanguage.desugarOrderBy(`${props.field as string} ${newDirection}`, environment) : undefined
			}
			getNewFilter={(filterArtifact, { environment }) => {
				const conditions: Input.Condition<boolean>[] = []

				if (filterArtifact.includeTrue) {
					conditions.push({ eq: true })
				}
				if (filterArtifact.includeFalse) {
					conditions.push({ eq: false })
				}
				if (filterArtifact.includeNull) {
					conditions.push({ isNull: true })
				}
				if (conditions.length === 0 || conditions.length === 3) {
					return undefined
				}

				const desugared = QueryLanguage.desugarRelativeSingleField(props.field, environment)
				return wrapFilterInHasOnes(desugared.hasOneRelationPath, {
					[desugared.field]: conditions.length > 1 ? { or: conditions } : conditions[0],
				})
			}}
			emptyFilter={{
				includeFalse: false,
				includeTrue: false,
				includeNull: false,
			}}
			filterRenderer={FilterRenderer}
		>
			<ValueRenderer {...props} />
		</DataGridColumn>
	)
}, 'BooleanCell')
