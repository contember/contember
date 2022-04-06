import { Input } from '@contember/client'
import { Select, TextInput } from '@contember/ui'
import { useCallback } from 'react'
import { useMessageFormatter } from '../../../../../i18n'
import { dataGridCellsDictionary } from './dataGridCellsDictionary'
import { TextFilterArtifacts } from './TextCell'

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type GenericTextCellFilterArtifacts = {
	mode: 'matches' | 'matchesExactly' | 'startsWith' | 'endsWith' | 'doesNotMatch'
	query: string
}

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
				value={filter.query}
				placeholder={formatMessage('dataGridCells.textCell.queryPlaceholder')}
				onChange={useCallback((value?: string | null) => {
					setFilter({
						...filter,
						query: value,
					})
				}, [filter, setFilter])}
			/>
		</>
	)
}

export const createGenericTextCellFilterCondition = (filter: GenericTextCellFilterArtifacts) => {
	const baseOperators = {
		matches: 'containsCI',
		doesNotMatch: 'containsCI',
		startsWith: 'startsWithCI',
		endsWith: 'endsWithCI',
		matchesExactly: 'eq',
	}

	let condition: Input.Condition<string> = {
		[baseOperators[filter.mode]]: filter.query,
	}

	if (filter.mode === 'doesNotMatch') {
		condition = { not: condition }
	}
	return condition
}
