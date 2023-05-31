import { acceptFieldVisitor } from '@contember/schema-utils'
import { Model } from '@contember/schema'

export const getUniqueConstraintColumns = ({ entity, fields, model }: {
	fields: readonly string[]
	model: Model.Schema
	entity: Model.Entity
}) => {
	return fields.map(fieldName => {
		return acceptFieldVisitor(model, entity, fieldName, {
			visitColumn: ({ column }) => {
				return column.columnName
			},
			visitManyHasOne: ({ relation }) => {
				return relation.joiningColumn.columnName
			},
			visitOneHasMany: () => {
				throw new Error(`Cannot create unique key on 1:m relation in ${entity.name}.${fieldName}`)
			},
			visitOneHasOneOwning: () => {
				throw new Error(
					`Cannot create unique key on 1:1 relation, this relation has unique key by default in ${entity.name}.${fieldName}`,
				)
			},
			visitOneHasOneInverse: () => {
				throw new Error(`Cannot create unique key on 1:1 inverse relation in ${entity.name}.${fieldName}`)
			},
			visitManyHasManyOwning: () => {
				throw new Error(`Cannot create unique key on m:m relation in ${entity.name}.${fieldName}`)
			},
			visitManyHasManyInverse: () => {
				throw new Error(`Cannot create unique key on m:m inverse relation in ${entity.name}.${fieldName}`)
			},
		})
	})
}
