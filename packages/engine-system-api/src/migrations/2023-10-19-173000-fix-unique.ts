import { MigrationArgs, MigrationBuilder } from '@contember/database-migrations'
import { DatabaseMetadata, wrapIdentifier } from '@contember/database'
import { SystemMigrationArgs } from './types'
import { getUniqueConstraintColumns } from '@contember/schema-migrations'

export default async function (builder: MigrationBuilder, args: MigrationArgs<SystemMigrationArgs>) {
	const schema = await args.schemaResolver(args.connection)
	const stages = (await args.connection.query<{schema: string}>('SELECT schema FROM stage')).rows
	const metadataByStage: Record<string, DatabaseMetadata> = {}

	for (const entity of Object.values(schema.model.entities)) {
		if (entity.view) {
			continue
		}

		const expectedUnique: string[][] = []

		for (const uniq of entity.unique) {
			const columns = getUniqueConstraintColumns({
				entity,
				fields: uniq.fields,
				model: schema.model,
			})
			expectedUnique.push(columns)
		}


		for (const stage of stages) {
			const databaseMetadata = metadataByStage[stage.schema] ??= await args.databaseMetadataResolver(args.connection, stage.schema)

			const existingUniqueConstraints = databaseMetadata.uniqueConstraints.filter({ tableName: entity.tableName }).toArray()
			for (const constraint of existingUniqueConstraints) {
				if (constraint.columnNames.length === 1 || expectedUnique.some(it => stringArrayEquals(it, constraint.columnNames))) {
					continue
				}
				builder.sql(`ALTER TABLE ${wrapIdentifier(stage.schema)}.${wrapIdentifier(entity.tableName)} DROP CONSTRAINT ${wrapIdentifier(constraint.constraintName)}`)
			}
		}
	}
}
const stringArrayEquals = (colA: string[], colB: string[]) => {
	if (colA.length !== colB.length) {
		return false
	}
	const a = [...colA].sort()
	const b = [...colB].sort()
	return a.every((it, index) => it === b[index])
}
