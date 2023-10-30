import { MigrationArgs, MigrationBuilder } from '@contember/database-migrations'
import { DatabaseMetadata, ForeignKeyDeleteAction, wrapIdentifier } from '@contember/database'
import { SystemMigrationArgs } from './types'
import { acceptFieldVisitor } from '@contember/schema-utils'
import { Model } from '@contember/schema'

export default async function (builder: MigrationBuilder, args: MigrationArgs<SystemMigrationArgs>) {
	const schema = await args.schemaResolver(args.connection)
	const stages = (await args.connection.query<{schema: string}>('SELECT schema FROM stage')).rows
	const metadataByStage: Record<string, DatabaseMetadata> = {}

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
			for (const stage of stages) {
				const databaseMetadata = metadataByStage[stage.schema] ??= await args.databaseMetadataResolver(args.connection, stage.schema)

				const fks = databaseMetadata.foreignKeys.filter({
					fromTable: entity.tableName,
					fromColumn: relation.joiningColumn.columnName,
					toTable: targetEntity.tableName,
					toColumn: targetEntity.primaryColumn,
				}).toArray()

				const dbConstraintFlag = ({
					[Model.OnDelete.setNull]: ForeignKeyDeleteAction.setnull,
					[Model.OnDelete.cascade]: ForeignKeyDeleteAction.cascade,
					[Model.OnDelete.restrict]: ForeignKeyDeleteAction.restrict,
				} as const)[relation.joiningColumn.onDelete]

				if (fks.every(it => it.deleteAction === dbConstraintFlag)) {
					continue
				}

				for (const fk of fks) {
					builder.sql(`ALTER TABLE ${wrapIdentifier(stage.schema)}.${wrapIdentifier(entity.tableName)} DROP CONSTRAINT ${wrapIdentifier(fk.constraintName)}`)
				}

				const onDelete = ({
					[Model.OnDelete.setNull]: 'SET NULL',
					[Model.OnDelete.cascade]: 'CASCADE',
					[Model.OnDelete.restrict]: 'RESTRICT',
				} as const)[relation.joiningColumn.onDelete]

				builder.sql(`ALTER TABLE ${wrapIdentifier(stage.schema)}.${wrapIdentifier(entity.tableName)}
					ADD FOREIGN KEY (${wrapIdentifier(relation.joiningColumn.columnName)}) 
					REFERENCES ${wrapIdentifier(stage.schema)}.${wrapIdentifier(targetEntity.tableName)} (${wrapIdentifier(targetEntity.primaryColumn)}) ON DELETE ${onDelete} DEFERRABLE INITIALLY IMMEDIATE
				`)
			}
		}
	}
}
