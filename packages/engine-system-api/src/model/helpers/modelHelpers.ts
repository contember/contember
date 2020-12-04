import { Model } from '@contember/schema'
import { acceptEveryFieldVisitor } from '@contember/schema-utils'

export const getJunctionTables = (model: Model.Schema): Model.JoiningTable[] => {
	const tables: Model.JoiningTable[] = []
	Object.values(model.entities).forEach(entity => {
		acceptEveryFieldVisitor(model, entity, {
			visitManyHasManyOwning: ({}, relation) => {
				tables.push(relation.joiningTable)
			},
			visitColumn: () => {},
			visitManyHasManyInverse: () => {},
			visitOneHasMany: () => {},
			visitManyHasOne: () => {},
			visitOneHasOneOwning: () => {},
			visitOneHasOneInverse: () => {},
		})
	})
	return tables
}
