import { createDateCell, DateCellRendererProps } from '@contember/react-datagrid'
import { useMessageFormatter } from '@contember/react-i18n'
import { DateFieldView, DateFieldViewFormattingProps, FieldFallbackViewPublicProps } from '@contember/react-binding-ui'
import { dateToStringWithoutTimezone } from '@contember/utilities'
import { dataGridCellsDictionary } from '../dict/dataGridCellsDictionary'
import { DateInput, FieldContainer, Stack, toDateString } from '@contember/ui'
import { forwardRef, memo, ReactNode, useCallback } from 'react'
import { Component } from '@contember/react-binding'
import { DataGridColumnPublicProps } from '../types'

export type DateCellValueRendererProps =
	& DateCellRendererProps
	& DateFieldViewFormattingProps
	& FieldFallbackViewPublicProps

/**
 * DataGrid cell for displaying a date field value.
 *
 * @example
 * ```
 * <DateCell header="Created at" field="createdAt" />
 * ```
 *
 * @group Data grid
 */
export const DateCell = createDateCell<DataGridColumnPublicProps, DateCellValueRendererProps>({
	FilterRenderer: ({ filter, setFilter }) => {
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
			<Stack horizontal align="center">
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
	},
	ValueRenderer: Component(({ field, ...props }: DateCellValueRendererProps) => {
		return <DateFieldView field={{ field }} {...props} />
	}),
})

const DateBoundInput = memo(
	forwardRef(({ label, children }: { label: string, children: ReactNode }, ref: any) => (
		<FieldContainer label={label} display="inline" labelPosition="left">
			{children}
		</FieldContainer>
	)),
)
