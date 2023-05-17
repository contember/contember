import { acceptFieldVisitor } from '@contember/schema-utils'
import { Model } from '@contember/schema'

export const getIndexColumns = ({ entity, fields, model }: { fields: readonly string[]; model: Model.Schema; entity: Model.Entity }) => {
	return fields.map(fieldName => {
		return acceptFieldVisitor(model, entity, fieldName, {
			visitColumn: ({ column }) => {
				return column.columnName
			},
			visitManyHasOne: ({ relation }) => {
				return relation.joiningColumn.columnName
			},
			visitOneHasOneOwning: ({ relation }) => {
				return relation.joiningColumn.columnName
			},
			visitOneHasMany: () => {
				throw new Error(`Cannot create index on 1:m relation in ${entity.name}.${fieldName}`)
			},
			visitOneHasOneInverse: () => {
				throw new Error(`Cannot create index on 1:1 inverse relation in ${entity.name}.${fieldName}`)
			},
			visitManyHasManyOwning: () => {
				throw new Error(`Cannot create index on m:m relation in ${entity.name}.${fieldName}`)
			},
			visitManyHasManyInverse: () => {
				throw new Error(`Cannot create index on m:m inverse relation in ${entity.name}.${fieldName}`)
			},
		})
	})
}
