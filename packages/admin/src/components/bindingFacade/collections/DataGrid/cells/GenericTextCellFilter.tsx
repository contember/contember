import { useMessageFormatter } from '../../../../../i18n'
import { dataGridCellsDictionary } from './dataGridCellsDictionary'
import { Select, TextInput } from '@contember/ui'
import { TextFilterArtifacts } from './TextCell'
import { Input } from '@contember/client'

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
		{ value: 'matches', label: formatMessage('dataGirdCells.textCell.matches') },
		{ value: 'doesNotMatch', label: formatMessage('dataGirdCells.textCell.doesNotMatch') },
		{ value: 'matchesExactly', label: formatMessage('dataGirdCells.textCell.matchesExactly') },
		{ value: 'startsWith', label: formatMessage('dataGirdCells.textCell.startsWith') },
		{ value: 'endsWith', label: formatMessage('dataGirdCells.textCell.endsWith') },
	]
	return (
		<>
			<Select
				value={filter.mode}
				options={options}
				onChange={e => {
					const value = e.currentTarget.value as TextFilterArtifacts['mode']

					setFilter({
						...filter,
						mode: value,
					})
				}}
			/>
			<TextInput
				value={filter.query}
				placeholder={formatMessage('dataGirdCells.textCell.queryPlaceholder')}
				onChange={e => {
					const value = e.currentTarget.value
					setFilter({
						...filter,
						query: value,
					})
				}}
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
