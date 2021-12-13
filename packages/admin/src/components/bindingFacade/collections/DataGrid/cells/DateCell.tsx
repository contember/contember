import { Component, QueryLanguage, wrapFilterInHasOnes } from '@contember/binding'
import type { Input } from '@contember/client'
import { FormGroup, TextInput } from '@contember/ui'
import { forwardRef, FunctionComponent, memo } from 'react'
import DatePicker from 'react-datepicker'
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

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
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
				const start = filter.start ? new Date(filter.start) : null
				const end = filter.end ? new Date(filter.end) : null
				return (
					<div style={{ display: 'flex', gap: '10px' }}>
						<DatePicker
							selected={start}
							onChange={date => {
								setFilter({ ...filter, start: date ? dateToStringWithoutTimezone(date as Date) : null })
							}}
							selectsStart
							startDate={start}
							endDate={end}
							isClearable
							customInput={<DateBoundInput label={formatMessage('dataGridCells.dateCell.fromLabel')} />}
						/>
						<DatePicker
							selected={end}
							onChange={date => {
								setFilter({ ...filter, end: date ? dateToStringWithoutTimezone(date as Date) : null })
							}}
							selectsEnd
							startDate={start}
							endDate={end}
							minDate={start}
							isClearable
							customInput={<DateBoundInput label={formatMessage('dataGridCells.dateCell.toLabel')} />}
						/>
					</div>
				)
			}}
		>
			<DateFieldView {...props} />
		</DataGridColumn>
	)
}, 'DateCell')

const DateBoundInput = memo(
	forwardRef(({ className, label, style, ...props }: any, ref: any) => (
		<FormGroup label={label} labelPosition="labelInlineLeft">
			<TextInput {...props} style={{ ...style, width: '130px' }} ref={ref} />
		</FormGroup>
	)),
)
