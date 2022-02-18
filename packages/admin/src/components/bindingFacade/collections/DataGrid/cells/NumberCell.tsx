import { Component, Field, FieldValue, QueryLanguage, SugaredRelativeSingleField, wrapFilterInHasOnes } from '@contember/binding'
import { Input } from '@contember/client'
import { TextInput, Select, Stack } from '@contember/ui'
import type { FunctionComponent, ReactElement, ReactNode } from 'react'
import { useMessageFormatter } from '../../../../../i18n'
import { FieldFallbackViewPublicProps, FieldFallbackView } from '../../../fieldViews'
import { DataGridOrderDirection, DataGridHeaderCellPublicProps, DataGridCellPublicProps, DataGridColumn } from '../base'
import { dataGridCellsDictionary } from './dataGridCellsDictionary'

export type NumberCellProps<Persisted extends FieldValue = FieldValue> =
	& DataGridHeaderCellPublicProps
	& DataGridCellPublicProps
	& FieldFallbackViewPublicProps
	& SugaredRelativeSingleField
	& {
		disableOrder?: boolean
		initialOrder?: DataGridOrderDirection
		format?: (value: Persisted) => ReactNode
	}

export type NumberFilterArtifacts = {
	mode: 'eq' | 'gte' | 'lte'
	query: string
}

export const NumberCell: FunctionComponent<NumberCellProps> = Component((props) => {
	return (
		<DataGridColumn<NumberFilterArtifacts>
			{...props}
			enableOrdering={!props.disableOrder as true}
			getNewOrderBy={(newDirection, { environment }) =>
				newDirection ? QueryLanguage.desugarOrderBy(`${props.field as string} ${newDirection}`, environment) : undefined
			}
			getNewFilter={(filter, { environment }) => {
				if (filter.query === '') {
					return undefined
				}

				const baseOperators = {
					eq: 'eq',
					gte: 'gte',
					lte: 'lte',
				}

				const condition: Input.Condition<string> = {
					[baseOperators[filter.mode]]: Number(filter.query),
				}

				const desugared = QueryLanguage.desugarRelativeSingleField(props, environment)
				return wrapFilterInHasOnes(desugared.hasOneRelationPath, {
					[desugared.field]: condition,
				})
			}}
			emptyFilter={{
				mode: 'eq',
				query: '',
			}}
			filterRenderer={({ filter, setFilter }) => {
				const formatMessage = useMessageFormatter(dataGridCellsDictionary)
				const options: Array<{
					value: NumberFilterArtifacts['mode']
					label: string
				}> = [
						{ value: 'eq', label: formatMessage('dataGridCells.numberCell.equals') },
						{ value: 'gte', label: formatMessage('dataGridCells.numberCell.greaterThan') },
						{ value: 'gte', label: formatMessage('dataGridCells.numberCell.lessThan') },
					]
				return (
					<Stack direction="horizontal">
						<Select
							value={filter.mode}
							options={options}
							onChange={(e) => {
								const value = e.currentTarget.value as NumberFilterArtifacts['mode']
								setFilter({
									...filter,
									mode: value,
								})
							}}
						/>
						<TextInput
							value={filter.query}
							placeholder="Value"
							onChange={(e) => {
								const value = e.currentTarget.value
								setFilter({
									...filter,
									query: value,
								})
							}}
						/>
					</Stack>
				)
			}}
		>
			<Field
				{...props}
				format={(value) => {
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
}, 'NumberCell') as <Persisted extends FieldValue = FieldValue>(props: NumberCellProps<Persisted>) => ReactElement
function formatMessage(arg0: string): string {
	throw new Error('Function not implemented.')
}

