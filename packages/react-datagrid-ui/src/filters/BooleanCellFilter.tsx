import { FilterRendererProps } from '@contember/react-datagrid'
import { dataGridCellsDictionary } from '../dict/dataGridCellsDictionary'
import { Checkbox, FieldContainer, Stack } from '@contember/ui'
import { useMessageFormatter } from '@contember/react-i18n'
import { BooleanFilterArtifacts } from '@contember/react-dataview'

export const BooleanCellFilter = ({ setFilter, filter }: FilterRendererProps<BooleanFilterArtifacts>) => {
	const formatMessage = useMessageFormatter(dataGridCellsDictionary)
	return (
		<Stack horizontal align="center">
			{(
				[
					['includeTrue', formatMessage('dataGridCells.booleanCell.includeTrue')],
					['includeFalse', formatMessage('dataGridCells.booleanCell.includeFalse')],
					['nullCondition', formatMessage('dataGridCells.booleanCell.includeNull')],
				] as const
			).map(([item, label], index) => (
				<FieldContainer
					key={`${index}-${label}`}
					display="inline"
					label={label}
					labelPosition="right"
				>
					<Checkbox
						key={item}
						notNull
						value={filter[item]}
						onChange={checked => {
							setFilter({ ...filter, [item]: checked })
						}}
					/>
				</FieldContainer>
			))}
		</Stack>
	)
}
