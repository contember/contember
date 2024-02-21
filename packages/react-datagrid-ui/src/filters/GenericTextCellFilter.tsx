import { Select, TextInput } from '@contember/ui'
import { useCallback } from 'react'
import { useMessageFormatter } from '@contember/react-i18n'
import { dataGridCellsDictionary } from '../dict/dataGridCellsDictionary'
import { GenericTextCellFilterArtifacts, TextFilterArtifacts } from '@contember/react-dataview'


/**
 * @group Data grid
 */
export const GenericTextCellFilter = <Filter extends GenericTextCellFilterArtifacts>({ filter, setFilter }: {
	filter: Filter,
	setFilter: (filter: Filter) => void,
}) => {
	const formatMessage = useMessageFormatter(dataGridCellsDictionary)
	const options: Array<{
		value: TextFilterArtifacts['mode']
		label: string
	}> = [
		{ value: 'matches', label: formatMessage('dataGridCells.textCell.matches') },
		{ value: 'doesNotMatch', label: formatMessage('dataGridCells.textCell.doesNotMatch') },
		{ value: 'matchesExactly', label: formatMessage('dataGridCells.textCell.matchesExactly') },
		{ value: 'startsWith', label: formatMessage('dataGridCells.textCell.startsWith') },
		{ value: 'endsWith', label: formatMessage('dataGridCells.textCell.endsWith') },
	]

	return (
		<>
			<Select
				required
				options={options}
				onChange={value => {
					setFilter({
						...filter,
						mode: value as TextFilterArtifacts['mode'],
					})
				}}
				placeholder={null}
				value={filter.mode}
			/>
			<TextInput
				notNull
				value={filter.query}
				placeholder={formatMessage('dataGridCells.textCell.queryPlaceholder')}
				onChange={useCallback((value?: string | null) => {
					if (value === null || value === undefined) {
						throw new Error('should not happen')
					}
					setFilter({
						...filter,
						query: value,
					})
				}, [filter, setFilter])}
			/>
		</>
	)
}

