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
	mode: 'matches' | 'matchesExactly' | 'startsWith' | 'endsWith' | 'doesNotMatch'
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
				if (filter.query === '' && filter.nullCondition === false) {
					return undefined
				}

				const baseOperators = {
					matches: 'containsCI',
					doesNotMatch: 'containsCI',
					startsWith: 'startsWithCI',
					endsWith: 'endsWithCI',
					matchesExactly: 'eq',
				}

				let condition: Input.Condition<string> = {
					[baseOperators[filter.mode]]: filter.query,
				}

				if (filter.mode === 'doesNotMatch') {
					condition = { not: condition }

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
				const options: Array<{
					value: TextFilterArtifacts['mode']
					label: string
				}> = [
					{ value: 'matches', label: 'Contains' },
					{ value: 'doesNotMatch', label: "Doesn't contain" },
					{ value: 'matchesExactly', label: 'Matches exactly' },
					{ value: 'startsWith', label: 'Starts with' },
					{ value: 'endsWith', label: 'Ends with' },
				]
				return (
					<div style={{ display: 'flex', gap: '0.5em', alignItems: 'center' }}>
						<Select
							value={filter.mode}
							options={options}
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
							<b>{filter.mode === 'doesNotMatch' ? 'Exclude' : 'Include'}</b>&nbsp;N/A
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
