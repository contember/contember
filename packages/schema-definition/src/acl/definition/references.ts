export class PredicateEvaluationReference {
	constructor(
		public readonly operation: 'update' | 'delete' | 'create' | 'read',
		public readonly field?: string,
	) {
	}
}

export const canUpdate = (field: string) => {
	return new PredicateEvaluationReference('update', field)
}

export const canRead = (field: string) => {
	return new PredicateEvaluationReference('read', field)
}
export const canCreate = (field: string) => {
	return new PredicateEvaluationReference('create', field)
}
export const canDelete = () => {
	return new PredicateEvaluationReference('delete')
}
