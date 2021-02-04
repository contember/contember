import {
	Component,
	Field,
	FieldValue,
	QueryLanguage,
	SugaredRelativeSingleField,
	wrapFilterInHasOnes,
} from '@contember/binding'
import { Input } from '@contember/client'
import { Select, TextInput } from '@contember/ui'
import * as React from 'react'
import { Checkbox } from '../../../../ui'
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

interface TextFilterArtifacts {
	mode: 'matches' | 'doesNotMatch'
	query: string
	nullCondition: boolean
}

export const TextCell = Component<TextCellProps>(props => {
	return (
		<DataGridColumn<TextFilterArtifacts>
			{...props}
			enableOrdering={!props.disableOrder as true}
			getNewOrderBy={(newDirection, { environment }) =>
				newDirection && QueryLanguage.desugarOrderBy(`${props.field as string} ${newDirection}`, environment)
			}
			getNewFilter={(filter, { environment }) => {
				let condition: Input.Condition<string> = {
					containsCI: filter.query,
				}

				if (filter.query === '' && filter.nullCondition === false) {
					return undefined
				}

				if (filter.mode === 'matches') {
					if (filter.nullCondition) {
						condition = {
							or: [condition, { isNull: true }],
						}
					}
				} else if (filter.mode === 'doesNotMatch') {
					condition = { not: condition }
					if (filter.nullCondition) {
						condition = {
							and: [condition, { isNull: false }],
						}
					}
				} else {
					return undefined
				}

				const desugared = QueryLanguage.desugarRelativeSingleField(props, environment)
				return wrapFilterInHasOnes(desugared.hasOneRelationPath, {
					[desugared.field]: condition,
				})
			}}
			emptyFilter={{
				mode: 'matches',
				query: '',
				nullCondition: false,
			}}
			filterRenderer={({ filter, setFilter }) => {
				return (
					<div style={{ display: 'flex', gap: '0.5em', alignItems: 'center' }}>
						<Select
							value={filter.mode}
							options={[
								{ value: 'matches', label: 'Matches' },
								{ value: 'doesNotMatch', label: "Doesn't match" },
							]}
							onChange={e => {
								const value = e.currentTarget.value as TextFilterArtifacts['mode']

								setFilter({
									...filter,
									mode: value,
									nullCondition: filter.mode === value ? filter.nullCondition : false,
								})
							}}
						/>
						<TextInput
							value={filter.query}
							placeholder="Query"
							onChange={e => {
								const value = e.currentTarget.value
								setFilter({
									...filter,
									query: value,
								})
							}}
						/>
						<Checkbox
							checked={filter.nullCondition}
							onChange={checked => {
								setFilter({
									...filter,
									nullCondition: checked,
								})
							}}
						>
							<b>{filter.mode === 'matches' ? 'Include' : 'Exclude'}</b>&nbsp;N/A
						</Checkbox>
					</div>
				)
			}}
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
