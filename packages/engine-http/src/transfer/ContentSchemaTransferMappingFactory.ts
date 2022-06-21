import { VersionedSchema } from '@contember/engine-system-api'
import { Model } from '@contember/schema'
import { acceptFieldVisitor } from '@contember/schema-utils'
import { DbColumnSchemaMap, TransferMapping, TransferTableMapping } from './TransferMapping'

export class ContentSchemaTransferMappingFactory {
	createContentSchemaMapping(contentSchema: VersionedSchema): TransferMapping {
		const tables: Record<string, TransferTableMapping> = {}

		for (const entity of Object.values(contentSchema.model.entities)) {
			tables[entity.tableName] = {
				name: entity.tableName,
				columns: this.buildDbColumnSchemaMap(contentSchema.model, entity),
			}

			for (const joiningTable of this.collectManyHasManyOwned(contentSchema.model, entity)) {
				tables[joiningTable.name] = joiningTable
			}
		}

		return { tables }
	}

	private buildDbColumnSchemaMap(schema: Model.Schema, entity: Model.Entity): DbColumnSchemaMap {
		const columns: DbColumnSchemaMap = {}

		for (const field of Object.values(entity.fields)) {
			const column = acceptFieldVisitor(schema, entity, field, {
				visitColumn: (entity, column) => {
					if (column.type !== Model.ColumnType.Enum) {
						return {
							name: column.columnName,
							type: column.type,
							nullable: column.nullable,
						}

					} else {
						return {
							name: column.columnName,
							type: column.type,
							nullable: column.nullable,
							values: schema.enums[column.columnType],
						}
					}
				},
				visitOneHasOneOwning: (entity, relation, targetEntity) => ({
					name: relation.joiningColumn.columnName,
					type: targetEntity.fields[targetEntity.primary].type as (Model.ColumnType.Uuid | Model.ColumnType.Int),
					nullable: relation.nullable,
				}),
				visitManyHasOne: (entity, relation, targetEntity) => ({
					name: relation.joiningColumn.columnName,
					type: targetEntity.fields[targetEntity.primary].type as (Model.ColumnType.Uuid | Model.ColumnType.Int),
					nullable: relation.nullable,
				}),
				visitManyHasManyOwning: () => null,
				visitManyHasManyInverse: () => null,
				visitOneHasMany: () => null,
				visitOneHasOneInverse: () => null,
			})

			if (column !== null) {
				columns[column.name] = column
			}
		}

		return columns
	}

	private collectManyHasManyOwned(schema: Model.Schema, entity: Model.Entity): TransferTableMapping[] {
		const joiningTables = []

		for (const field of Object.values(entity.fields)) {
			const joiningTable = acceptFieldVisitor<TransferTableMapping | null>(schema, entity, field, {
				visitColumn: () => null,
				visitOneHasOneOwning: () => null,
				visitManyHasOne: () => null,
				visitManyHasManyOwning: (entity, relation, targetEntity) => ({
					name: relation.joiningTable.tableName,
					columns: {
						[relation.joiningTable.joiningColumn.columnName]: {
							name: relation.joiningTable.joiningColumn.columnName,
							type: entity.fields[entity.primary].type as (Model.ColumnType.Uuid | Model.ColumnType.Int),
							nullable: false,
						},
						[relation.joiningTable.inverseJoiningColumn.columnName]: {
							name: relation.joiningTable.inverseJoiningColumn.columnName,
							type: targetEntity.fields[targetEntity.primary].type as (Model.ColumnType.Uuid | Model.ColumnType.Int),
							nullable: false,
						},
					},
				}),
				visitManyHasManyInverse: () => null,
				visitOneHasMany: () => null,
				visitOneHasOneInverse: () => null,
			})

			if (joiningTable !== null) {
				joiningTables.push(joiningTable)
			}
		}

		return joiningTables
	}
}
