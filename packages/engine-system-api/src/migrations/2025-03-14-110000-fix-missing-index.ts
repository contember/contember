import { MigrationArgs, MigrationBuilder } from '@contember/database-migrations'
import { DatabaseMetadata } from '@contember/database'
import { SystemMigrationArgs } from './types'
import { wrapIdentifier } from '@contember/database'
import { Model } from '@contember/schema'
import { acceptFieldVisitor } from '@contember/schema-utils'

export default async function (builder: MigrationBuilder, args: MigrationArgs<SystemMigrationArgs>) {
	const schema = (await args.schemaResolver(args.connection)).schema
	const stages = (await args.connection.query<{schema: string}>('SELECT schema FROM stage')).rows
	const metadataByStage: Record<string, DatabaseMetadata> = {}

	for (const entity of Object.values(schema.model.entities)) {
		if (entity.indexes.length === 0) {
			continue
		}

		for (const stage of stages) {
			const databaseMetadata = metadataByStage[stage.schema] ??= await args.databaseMetadataResolver(args.connection, stage.schema)

			for (const index of entity.indexes) {
				const columns = getIndexColumns({
					entity,
					fields: index.fields,
					model: schema.model,
				})
				const indexNames = databaseMetadata.indexes.filter({ tableName: entity.tableName, columnNames: columns }).getNames()
				if (indexNames.length > 0) {
					continue
				}

				const tableNameId = wrapIdentifier(entity.tableName)
				const columnNameIds = columns.map(wrapIdentifier)

				builder.sql(`CREATE INDEX ON ${wrapIdentifier(stage.schema)}.${tableNameId} (${columnNameIds.join(', ')})`)

			}
		}
	}
}

const getIndexColumns = ({ entity, fields, model }: { fields: readonly string[]; model: Model.Schema; entity: Model.Entity }) => {
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
