import { Component, FieldValue, Filter, QueryLanguage, wrapFilterInHasOnes } from '@contember/react-binding'
import { Stack } from '@contember/ui'
import { FC, ReactElement } from 'react'
import { CoalesceFieldView, CoalesceFieldViewProps, FieldFallbackViewPublicProps } from '../../../fieldViews'
import { DataGridColumn, DataGridColumnPublicProps } from '../base'
import { GenericTextCellFilter, createGenericTextCellFilterCondition } from './GenericTextCellFilter'

export type CoalesceTextCellProps<Persisted extends FieldValue = FieldValue> =
	& DataGridColumnPublicProps
	& FieldFallbackViewPublicProps
	& CoalesceFieldViewProps<Persisted>
	& {
		initialFilter?: CoalesceTextFilterArtifacts
	}

export type CoalesceTextFilterArtifacts = {
	mode: 'matches' | 'matchesExactly' | 'startsWith' | 'endsWith' | 'doesNotMatch'
	query: string
}

/**
 * DataGrid cells with for text fields with a fallback support.
 *
 * @example
 * ```
 * <CoalesceTextCell fields={['email', 'user.email']} header="E-mail" />
 * ```
 *
 * @group Data grid
 */
export const CoalesceTextCell: FC<CoalesceTextCellProps> = Component(props => {
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
			filterRenderer={props => {
				return (
					<Stack horizontal align="center">
						<GenericTextCellFilter {...props} />
					</Stack>
				)
			}}
		>
			<CoalesceFieldView {...props} />
		</DataGridColumn>
	)
}, 'CoalesceTextCell') as <Persisted extends FieldValue = FieldValue>(
	props: CoalesceTextCellProps<Persisted>,
) => ReactElement
