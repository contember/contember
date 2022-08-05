import { MigrationArgs, MigrationBuilder } from '@contember/database-migrations'
import { wrapIdentifier } from '@contember/database'
import { SystemMigrationArgs } from './types'
import { acceptFieldVisitor, NamingHelper } from '@contember/schema-utils'
import { Model } from '@contember/schema'

export default async function (builder: MigrationBuilder, args: MigrationArgs<SystemMigrationArgs>) {
	const schema = await args.schemaResolver(args.connection)
	const stages = (await args.connection.query('SELECT schema FROM stage')).rows
	for (const entity of Object.values(schema.model.entities)) {
		for (const field of Object.values(entity.fields)) {
			const result = acceptFieldVisitor<null | {
				relation: Model.OneHasOneOwningRelation | Model.ManyHasOneRelation
				targetEntity: Model.Entity
			}>(schema.model, entity, field, {
				visitManyHasOne: ({ entity, relation, targetEntity }) => {
					return { relation, entity, targetEntity }
				},
				visitOneHasOneOwning: ({ entity, relation, targetEntity }) => {
					return { relation, entity, targetEntity }
				},
				visitOneHasOneInverse: () => null,
				visitManyHasManyInverse: () => null,
				visitManyHasManyOwning: () => null,
				visitOneHasMany: () => null,
				visitColumn: () => null,
			})
			if (!result) {
				continue
			}
			const { targetEntity, relation } = result
			if (entity.view || targetEntity.view) {
				continue
			}
			if (relation.joiningColumn.onDelete === Model.OnDelete.restrict) {
				continue
			}
			for (const stage of stages) {
				const fkName = NamingHelper.createForeignKeyName(
					entity.tableName,
					relation.joiningColumn.columnName,
					targetEntity.tableName,
					targetEntity.primaryColumn,
				)
				const tableName = { name: entity.tableName, schema: stage.schema }

				builder.dropConstraint(tableName, fkName)

				const onDelete = ({
					[Model.OnDelete.setNull]: 'SET NULL',
					[Model.OnDelete.cascade]: 'CASCADE',
				} as const)[relation.joiningColumn.onDelete]

				builder.addConstraint(tableName, fkName, {
					foreignKeys: {
						columns: relation.joiningColumn.columnName,
						references: `${wrapIdentifier(stage.schema)}.${wrapIdentifier(targetEntity.tableName)}(${wrapIdentifier(targetEntity.primaryColumn)})`,
						onDelete: onDelete,
					},
					deferrable: true,
					deferred: false,
				})
			}
		}
	}
}
