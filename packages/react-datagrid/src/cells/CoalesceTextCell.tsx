import {
	Component,
	Filter,
	QueryLanguage,
	SugarableRelativeSingleField,
	wrapFilterInHasOnes,
} from '@contember/react-binding'
import { ComponentType, FunctionComponent } from 'react'
import { DataGridColumnCommonProps, FilterRendererProps } from '../types'
import { DataGridColumn } from '../grid'
import { createGenericTextCellFilterCondition } from './common'

export type CoalesceCellRendererProps = {
	fields: (SugarableRelativeSingleField | string)[]
	initialFilter?: CoalesceTextFilterArtifacts
}

export type CoalesceTextCellProps =
	& DataGridColumnCommonProps
	& CoalesceCellRendererProps
	& {
		initialFilter?: CoalesceTextFilterArtifacts
	}

export type CoalesceTextFilterArtifacts = {
	mode: 'matches' | 'matchesExactly' | 'startsWith' | 'endsWith' | 'doesNotMatch'
	query: string
}

export const createCoalesceTextCell = <ColumnProps extends {}, ValueRendererProps extends {}>({ FilterRenderer, ValueRenderer }: {
	FilterRenderer: ComponentType<FilterRendererProps<CoalesceTextFilterArtifacts>>,
	ValueRenderer: ComponentType<CoalesceCellRendererProps & ValueRendererProps>
}): FunctionComponent<CoalesceTextCellProps & ColumnProps & ValueRendererProps> => Component(props => {
	return (
		<DataGridColumn<CoalesceTextFilterArtifacts>
			{...props}
			enableOrdering={false}
			getNewFilter={(filter, { environment }): Filter | undefined => {
				if (filter.query === '') {
					return undefined
				}
				const condition = createGenericTextCellFilterCondition(filter)
				const parts: Filter[] = []
				for (const field of props.fields) {
					const desugared = QueryLanguage.desugarRelativeSingleField({ field: field }, environment)
					const fieldCondition = wrapFilterInHasOnes(desugared.hasOneRelationPath, {
						[desugared.field]: condition,
					})
					parts.push(fieldCondition)
				}
				return filter.mode === 'doesNotMatch' ? { and: parts } : { or: parts }
			}}
			emptyFilter={{
				mode: 'matches',
				query: '',
			}}
			filterRenderer={FilterRenderer}
		>
			<ValueRenderer {...props} />
		</DataGridColumn>
	)
}, 'CoalesceTextCell')
