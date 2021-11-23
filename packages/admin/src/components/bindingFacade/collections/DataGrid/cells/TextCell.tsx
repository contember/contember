import {
	Component,
	Field,
	FieldValue,
	QueryLanguage,
	SugaredRelativeSingleField,
	wrapFilterInHasOnes,
} from '@contember/binding'
import type { Input } from '@contember/client'
import { Checkbox, Select, TextInput } from '@contember/ui'
import type { FunctionComponent, ReactElement, ReactNode } from 'react'
import { useMessageFormatter } from '../../../../../i18n'
import { FieldFallbackView, FieldFallbackViewPublicProps } from '../../../fieldViews'
import { DataGridColumn, DataGridColumnPublicProps, DataGridOrderDirection } from '../base'
import { dataGridCellsDictionary } from './dataGridCellsDictionary'

export type TextCellProps<Persisted extends FieldValue = FieldValue> =
	& DataGridColumnPublicProps
	& FieldFallbackViewPublicProps
	& SugaredRelativeSingleField
	& {
		disableOrder?: boolean
		initialOrder?: DataGridOrderDirection
		format?: (value: Persisted) => ReactNode
	}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type TextFilterArtifacts = {
	mode: 'matches' | 'matchesExactly' | 'startsWith' | 'endsWith' | 'doesNotMatch'
	query: string
	nullCondition: boolean
}

export const TextCell: FunctionComponent<TextCellProps> = Component(props => {
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
				const formatMessage = useMessageFormatter(dataGridCellsDictionary)
				const options: Array<{
					value: TextFilterArtifacts['mode']
					label: string
				}> = [
					{ value: 'matches', label: formatMessage('dataGirdCells.textCell.matches') },
					{ value: 'doesNotMatch', label: formatMessage('dataGirdCells.textCell.doesNotMatch') },
					{ value: 'matchesExactly', label: formatMessage('dataGirdCells.textCell.matchesExactly') },
					{ value: 'startsWith', label: formatMessage('dataGirdCells.textCell.startsWith') },
					{ value: 'endsWith', label: formatMessage('dataGirdCells.textCell.endsWith') },
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
							placeholder={formatMessage('dataGirdCells.textCell.queryPlaceholder')}
							onChange={e => {
								const value = e.currentTarget.value
								setFilter({
									...filter,
									query: value,
								})
							}}
						/>
						<Checkbox
							value={filter.nullCondition}
							onChange={checked => {
								setFilter({
									...filter,
									nullCondition: checked,
								})
							}}
						>
							<span style={{ whiteSpace: 'nowrap' }}>
								{filter.mode === 'doesNotMatch'
									? formatMessage('dataGirdCells.textCell.excludeNull', {
											strong: chunks => <strong>{chunks}</strong>,
									  })
									: formatMessage('dataGirdCells.textCell.includeNull', {
											strong: chunks => <strong>{chunks}</strong>,
									  })}
							</span>
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
						return props.format(value as any)
					}
					return value
				}}
			/>
		</DataGridColumn>
	)
}, 'TextCell') as <Persisted extends FieldValue = FieldValue>(props: TextCellProps<Persisted>) => ReactElement
