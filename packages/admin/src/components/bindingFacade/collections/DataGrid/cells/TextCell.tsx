import {
	Component,
	Field,
	FieldValue,
	QueryLanguage,
	SugaredRelativeSingleField,
	wrapFilterInHasOnes,
} from '@contember/binding'
import { FormGroup, TextInput } from '@contember/ui'
import * as React from 'react'
import { FieldFallbackView, FieldFallbackViewPublicProps } from '../../../fieldViews'
import { DataGridCellPublicProps, DataGridColumn, DataGridHeaderCellPublicProps, DataGridOrderDirection } from '../base'

export type TextCellProps<Persisted extends FieldValue = FieldValue> = DataGridHeaderCellPublicProps &
	DataGridCellPublicProps &
	FieldFallbackViewPublicProps &
	SugaredRelativeSingleField & {
		disableOrder?: boolean
		initialOrder?: DataGridOrderDirection
		format?: (value: Persisted) => React.ReactNode
	}

export const TextCell = Component<TextCellProps>(props => {
	return (
		<DataGridColumn<string>
			{...props}
			enableOrdering={!props.disableOrder as true}
			getNewOrderBy={(newDirection, { environment }) =>
				newDirection && QueryLanguage.desugarOrderBy(`${props.field as string} ${newDirection}`, environment)
			}
			getNewFilter={(filterArtifact, { environment }) => {
				const desugared = QueryLanguage.desugarRelativeSingleField(props, environment)
				return wrapFilterInHasOnes(desugared.hasOneRelationPath, {
					[desugared.field]: {
						containsCI: filterArtifact,
					},
				})
			}}
			filterRenderer={({ filter, setFilter }) => (
				<FormGroup label={props.header}>
					<TextInput
						value={filter ?? ''}
						onChange={e => {
							const value = e.currentTarget.value
							setFilter(value === '' ? undefined : value)
						}}
					/>
				</FormGroup>
			)}
		>
			<Field
				{...props}
				format={value => {
					if (value === null) {
						return <FieldFallbackView fallback={props.fallback} fallbackStyle={props.fallbackStyle} />
					}
					if (props.format) {
						return props.format(value)
					}
					return value
				}}
			/>
		</DataGridColumn>
	)
}, 'TextCell') as <Persisted extends FieldValue = FieldValue>(props: TextCellProps<Persisted>) => React.ReactElement
