import { Component, Literal, QueryLanguage, wrapFilterInHasOnes } from '@contember/binding'
import type { Input } from '@contember/client'
import { FormGroup, TextInput } from '@contember/ui'
import { forwardRef, FunctionComponent, memo } from 'react'
import DatePicker from 'react-datepicker'
import { useMessageFormatter } from '../../../../../i18n'
import { DateFieldView, DateFieldViewProps } from '../../../fieldViews'
import { DataGridCellPublicProps, DataGridColumn, DataGridHeaderCellPublicProps, DataGridOrderDirection } from '../base'
import { dataGridCellsDictionary } from './dataGridCellsDictionary'

export type DateCellProps = DataGridHeaderCellPublicProps &
	DataGridCellPublicProps &
	DateFieldViewProps & {
		disableOrder?: boolean
		initialOrder?: DataGridOrderDirection
	}

interface DateRange {
	start: Date | undefined
	end: Date | undefined
}

export const DateCell: FunctionComponent<DateCellProps> = Component(props => {
	return (
		<DataGridColumn<DateRange>
			{...props}
			enableOrdering={!props.disableOrder as true}
			getNewOrderBy={(newDirection, { environment }) =>
				newDirection && QueryLanguage.desugarOrderBy(`${props.field as string} ${newDirection}`, environment)
			}
			getNewFilter={(filterArtifact, { environment }) => {
				if (!filterArtifact.start && !filterArtifact.end) {
					return undefined
				}
				const desugared = QueryLanguage.desugarRelativeSingleField(props.field, environment)

				const conditions: Input.Condition<Input.ColumnValue<Literal>>[] = []

				if (filterArtifact.start) {
					conditions.push({ gte: filterArtifact.start.toISOString() })
				}
				if (filterArtifact.end) {
					conditions.push({ lte: filterArtifact.end.toISOString() })
				}

				return wrapFilterInHasOnes(desugared.hasOneRelationPath, {
					[desugared.field]: conditions.length > 1 ? { and: conditions } : conditions[0],
				})
			}}
			emptyFilter={{
				start: undefined,
				end: undefined,
			}}
			filterRenderer={({ filter, setFilter }) => {
				const formatMessage = useMessageFormatter(dataGridCellsDictionary)
				const { start, end } = filter
				return (
					<div style={{ display: 'flex', gap: '10px' }}>
						<DatePicker
							selected={start}
							onChange={date => {
								setFilter({ ...filter, start: (date as Date | null) ?? undefined })
							}}
							selectsStart
							startDate={start}
							endDate={end}
							isClearable
							customInput={<DateBoundInput label={formatMessage('dataGirdCells.dateCell.fromLabel')} />}
						/>
						<DatePicker
							selected={end}
							onChange={date => {
								setFilter({ ...filter, end: (date as Date | null) ?? undefined })
							}}
							selectsEnd
							startDate={start}
							endDate={end}
							minDate={start}
							isClearable
							customInput={<DateBoundInput label={formatMessage('dataGirdCells.dateCell.toLabel')} />}
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
