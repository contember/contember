import { useMessageFormatter } from '../../../../../../i18n'
import { dataGridCellsDictionary } from '../dict/dataGridCellsDictionary'
import { NullConditionFilter, NullConditionFilterPublicProps } from './NullConditionFilter'
import { NumberCellRendererProps, NumberFilterArtifacts } from '../../cells'
import { FilterRendererProps } from '../../types'
import { NumberInput, Select, Stack } from '@contember/ui'

export type NumberCellFilterExtraProps =
	& NullConditionFilterPublicProps
	& NumberCellRendererProps

export const NumberCellFilter = ({ filter, setFilter, environment, field, showNullConditionFilter }: FilterRendererProps<NumberFilterArtifacts, NumberCellFilterExtraProps>) => {
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
		<Stack gap="gap">
			<Stack horizontal align="center" gap="gap">
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
			<NullConditionFilter filter={filter} setFilter={setFilter} environment={environment} field={field} showNullConditionFilter={showNullConditionFilter} />
		</Stack>
	)
}
