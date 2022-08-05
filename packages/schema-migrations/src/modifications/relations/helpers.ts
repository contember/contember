import { MigrationBuilder } from '@contember/database-migrations'
import { NamingHelper } from '@contember/schema-utils'
import { Model } from '@contember/schema'

export const addForeignKeyConstraint = ({ builder, entity, relation, targetEntity, recreate = false }: {
	recreate?: boolean
	builder: MigrationBuilder
	entity: Model.Entity
	targetEntity: Model.Entity
	relation: Model.OneHasOneOwningRelation | Model.ManyHasOneRelation
}) => {
	const fkName = NamingHelper.createForeignKeyName(
		entity.tableName,
		relation.joiningColumn.columnName,
		targetEntity.tableName,
		targetEntity.primaryColumn,
	)
	if (recreate) {
		builder.dropConstraint(entity.tableName, fkName)
	}
	builder.addConstraint(entity.tableName, fkName, {
		foreignKeys: {
			columns: relation.joiningColumn.columnName,
			references: `"${targetEntity.tableName}"("${targetEntity.primaryColumn}")`,
			onDelete: ({
				[Model.OnDelete.setNull]: 'SET NULL',
				[Model.OnDelete.cascade]: 'CASCADE',
				[Model.OnDelete.restrict]: 'NO ACTION',
			} as const)[relation.joiningColumn.onDelete],
		},
		deferrable: true,
		deferred: false,
	})
}
