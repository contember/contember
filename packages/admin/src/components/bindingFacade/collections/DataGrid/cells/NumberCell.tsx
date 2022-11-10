import { Component, Field, FieldValue, QueryLanguage, SugaredRelativeSingleField, wrapFilterInHasOnes } from '@contember/binding'
import { Input } from '@contember/client'
import { NumberInput, Select, Stack } from '@contember/ui'
import type { FunctionComponent, ReactElement, ReactNode } from 'react'
import { useMessageFormatter } from '../../../../../i18n'
import { FieldFallbackView, FieldFallbackViewPublicProps } from '../../../fieldViews'
import { DataGridCellPublicProps, DataGridColumn, DataGridHeaderCellPublicProps, DataGridOrderDirection } from '../base'
import { dataGridCellsDictionary } from './dataGridCellsDictionary'

export type NumberCellProps =
	& DataGridHeaderCellPublicProps
	& DataGridCellPublicProps
	& FieldFallbackViewPublicProps
	& SugaredRelativeSingleField
	& {
		disableOrder?: boolean
		initialOrder?: DataGridOrderDirection
		format?: (value: number) => ReactNode
	}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type NumberFilterArtifacts = {
	mode: 'eq' | 'gte' | 'lte'
	query: number | null
}

export const NumberCell: FunctionComponent<NumberCellProps> = Component(props => {
	return (
		<DataGridColumn<NumberFilterArtifacts>
			{...props}
			enableOrdering={!props.disableOrder as true}
			getNewOrderBy={(newDirection, { environment }) =>
				newDirection ? QueryLanguage.desugarOrderBy(`${props.field as string} ${newDirection}`, environment) : undefined
			}
			getNewFilter={(filter, { environment }) => {
				if (filter.query === null) {
					return undefined
				}

				const baseOperators = {
					eq: 'eq',
					gte: 'gte',
					lte: 'lte',
				}

				const condition: Input.Condition = {
					[baseOperators[filter.mode]]: filter.query,
				}

				const desugared = QueryLanguage.desugarRelativeSingleField(props, environment)
				return wrapFilterInHasOnes(desugared.hasOneRelationPath, {
					[desugared.field]: condition,
				})
			}}
			emptyFilter={{
				mode: 'eq',
				query: null,
			}}
			filterRenderer={({ filter, setFilter }) => {
				const formatMessage = useMessageFormatter(dataGridCellsDictionary)
				const options: Array<{
					value: NumberFilterArtifacts['mode']
					label: string
				}> = [
						{ value: 'eq', label: formatMessage('dataGridCells.numberCell.equals') },
						{ value: 'gte', label: formatMessage('dataGridCells.numberCell.greaterThan') },
						{ value: 'lte', label: formatMessage('dataGridCells.numberCell.lessThan') },
					]
				return (
					<Stack direction="horizontal">
						<Select
							notNull
							value={filter.mode}
							options={options}
							onChange={value => {
								if (!value) {
									return
								}

								setFilter({
									...filter,
									mode: value,
								})
							}}
						/>
						<NumberInput
							value={filter.query}
							placeholder="Value"
							onChange={value => {
								setFilter({
									...filter,
									query: value ?? null,
								})
							}}
						/>
					</Stack>
				)
			}}
		>
			<Field<number>
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
}, 'NumberCell')
