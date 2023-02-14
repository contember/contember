import { useMessageFormatter } from '../../../../../../i18n'
import { dataGridCellsDictionary } from '../dict/dataGridCellsDictionary'
import { GenericTextCellFilter } from './GenericTextCellFilter'
import { FilterRendererProps } from '../../types'
import { TextFilterArtifacts } from '../../cells'
import { Checkbox, FieldContainer, Stack } from '@contember/ui'

export const TextCellFilter = ({ filter, setFilter, ...props }: FilterRendererProps<TextFilterArtifacts>) => {
	const formatMessage = useMessageFormatter(dataGridCellsDictionary)
	const label = (
		<span style={{ whiteSpace: 'nowrap' }}>
			{filter.mode === 'doesNotMatch'
				? formatMessage('dataGridCells.textCell.excludeNull', {
					strong: chunks => <strong>{chunks}</strong>,
				})
				: formatMessage('dataGridCells.textCell.includeNull', {
					strong: chunks => <strong>{chunks}</strong>,
				})}
		</span>
	)
	return (
		<Stack horizontal align="center">
			<GenericTextCellFilter {...props} filter={filter} setFilter={setFilter} />
			<FieldContainer label={label} labelPosition="right" display="inline">
				<Checkbox
					notNull
					value={filter.nullCondition}
					onChange={checked => {
						setFilter({
							...filter,
							nullCondition: !!checked,
						})
					}}
				/>
			</FieldContainer>
		</Stack>
	)
}
