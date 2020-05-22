import { Model } from '@contember/schema'
import { acceptEveryFieldVisitor } from '@contember/schema-utils'

export const getJunctionTables = (model: Model.Schema): Model.JoiningTable[] => {
	const tables: Model.JoiningTable[] = []
	Object.values(model.entities).forEach(entity => {
		acceptEveryFieldVisitor(model, entity, {
			visitManyHasManyOwner: ({}, relation) => {
				tables.push(relation.joiningTable)
			},
			visitColumn: () => {},
			visitManyHasManyInversed: () => {},
			visitOneHasMany: () => {},
			visitManyHasOne: () => {},
			visitOneHasOneOwner: () => {},
			visitOneHasOneInversed: () => {},
		})
	})
	return tables
}
