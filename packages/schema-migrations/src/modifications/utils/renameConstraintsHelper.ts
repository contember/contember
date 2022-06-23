import { Model, Writable } from '@contember/schema'
import { MigrationBuilder } from '@contember/database-migrations'
import { EntityUpdater } from './schemaUpdateUtils.js'

type NameGenerator = (constraint: Model.UniqueConstraint) => string | null
export const renameConstraintsSqlBuilder = (
	builder: MigrationBuilder,
	entity: Model.Entity,
	nameGenerator: NameGenerator,
) => {
	const tableName = entity.tableName
	for (const constraint of Object.values(entity.unique)) {
		const newName = nameGenerator(constraint)
		if (newName === null) {
			continue
		}
		builder.renameConstraint(tableName, constraint.name, newName)
	}
}

export const renameConstraintSchemaUpdater = (nameGenerator: NameGenerator): EntityUpdater => {
	return ({ entity }) => {
		const newConstraints: Writable<Model.UniqueConstraints> = {}
		for (const constraint of Object.values(entity.unique)) {
			const newName = nameGenerator(constraint)
			if (newName === null) {
				newConstraints[constraint.name] = constraint
			} else {
				newConstraints[newName] = { ...constraint, name: newName }
			}
		}
		return { ...entity, unique: newConstraints }
	}
}
