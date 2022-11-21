import { Component, QueryLanguage, wrapFilterInHasOnes } from '@contember/binding'
import type { Input } from '@contember/client'
import { DateInput, FieldContainer, Stack, toDateString } from '@contember/ui'
import { forwardRef, FunctionComponent, memo, ReactNode, useCallback } from 'react'
import { useMessageFormatter } from '../../../../../i18n'
import { dateToStringWithoutTimezone } from '../../../../../utils'
import { DateFieldView, DateFieldViewProps } from '../../../fieldViews'
import { DataGridColumn, DataGridColumnPublicProps, DataGridOrderDirection } from '../base'
import { dataGridCellsDictionary } from './dataGridCellsDictionary'

export type DateCellProps =
	& DataGridColumnPublicProps
	& DateFieldViewProps
	& {
		disableOrder?: boolean
		initialOrder?: DataGridOrderDirection
	}

type DateRange = {
	start: string | null
	end: string | null
}

export const DateCell: FunctionComponent<DateCellProps> = Component(props => {
	return (
		<DataGridColumn<DateRange>
			{...props}
			enableOrdering={!props.disableOrder as true}
			getNewOrderBy={(newDirection, { environment }) =>
				newDirection ? QueryLanguage.desugarOrderBy(`${props.field as string} ${newDirection}`, environment) : undefined
			}
			getNewFilter={(filterArtifact, { environment }) => {
				if (!filterArtifact.start && !filterArtifact.end) {
					return undefined
				}
				const desugared = QueryLanguage.desugarRelativeSingleField(props.field, environment)

				const conditions: Input.Condition<Input.ColumnValue>[] = []

				if (filterArtifact.start) {
					conditions.push({ gte: filterArtifact.start })
				}
				if (filterArtifact.end) {
					conditions.push({ lte: filterArtifact.end })
				}

				return wrapFilterInHasOnes(desugared.hasOneRelationPath, {
					[desugared.field]: conditions.length > 1 ? { and: conditions } : conditions[0],
				})
			}}
			emptyFilter={{
				start: null,
				end: null,
			}}
			filterRenderer={({ filter, setFilter }) => {
				const formatMessage = useMessageFormatter(dataGridCellsDictionary)

				const start = toDateString(filter.start) ?? ''
				const end = toDateString(filter.end) ?? ''

				const onDateStartChange = useCallback((value?: string | null) => {
					setFilter({
						...filter,
						start: value ? dateToStringWithoutTimezone(new Date(value)) : null,
					})
				}, [filter, setFilter])
				const onDateEndChange = useCallback((value?: string | null) => {
					setFilter({
						...filter,
						end: value ? dateToStringWithoutTimezone(new Date(value)) : null,
					})
				}, [filter, setFilter])

				return (
					<Stack direction="horizontal">
						<DateBoundInput label={formatMessage('dataGridCells.dateCell.fromLabel')}>
							<DateInput
								value={start}
								onChange={onDateStartChange}
								max={end}
							/>
						</DateBoundInput>
						<DateBoundInput label={formatMessage('dataGridCells.dateCell.toLabel')}>
							<DateInput
								value={end}
								onChange={onDateEndChange}
								min={start}
							/>
						</DateBoundInput>
					</Stack>
				)
			}}
		>
			<DateFieldView {...props} />
		</DataGridColumn>
	)
}, 'DateCell')

const DateBoundInput = memo(
	forwardRef(({ label, children }: { label: string, children: ReactNode }, ref: any) => (
		<FieldContainer label={label} labelPosition="labelInlineLeft">
			{children}
		</FieldContainer>
	)),
)
