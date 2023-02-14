import { EntityId } from '@contember/react-binding'
import { Input } from '@contember/client'
import { SelectOptions } from '../../../fields/ChoiceField/hooks/useSelectOptions'

export type SelectCellArtifacts = {
	id: EntityId[]
	nullCondition: boolean
}

export type SelectCellFilterExtraProps = SelectOptions

export type GenericTextCellFilterArtifacts = {
	mode: 'matches' | 'matchesExactly' | 'startsWith' | 'endsWith' | 'doesNotMatch'
	query: string
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
