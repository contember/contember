import { EntityId } from '@contember/react-binding'
import { Input } from '@contember/client'

export type RelationFilterArtifacts = {
	id?: EntityId[]
	notId?: EntityId[]
	nullCondition?: boolean
}


export type GenericTextCellFilterArtifacts = {
	mode?: 'matches' | 'matchesExactly' | 'startsWith' | 'endsWith' | 'doesNotMatch'
	query?: string
}

export const createGenericTextCellFilterCondition = (filter: GenericTextCellFilterArtifacts) => {
	if (!filter.query) {
		return {}
	}
	const baseOperators = {
		matches: 'containsCI',
		doesNotMatch: 'containsCI',
		startsWith: 'startsWithCI',
		endsWith: 'endsWithCI',
		matchesExactly: 'eq',
	}

	let condition: Input.Condition<string> = {
		[baseOperators[filter.mode ?? 'matches']]: filter.query,
	}

	if (filter.mode === 'doesNotMatch') {
		condition = { not: condition }
	}
	return condition
}
