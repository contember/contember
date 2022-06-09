import { Model, Schema } from '@contember/schema'
import { acceptFieldVisitor } from '@contember/schema-utils'

export type DbSchema = { tables: DbTableSchemaMap }
export type DbTableSchemaMap = Record<string, DbTableSchema>
export type DbTableSchema = { name: string; columns: DbColumnSchemaMap }
export type DbColumnSchemaMap = Record<string, DbColumnSchema>
export type DbColumnSchema = { name: string; type: Model.ColumnType; nullable: boolean }

export class DbSchemaBuilder {
	static build(schema: Schema): DbSchema {
		const tables: Record<string, DbTableSchema> = {}

		for (const entity of Object.values(schema.model.entities)) {
			tables[entity.tableName] = {
				name: entity.tableName,
				columns: this.buildDbColumnSchemaMap(schema, entity),
			}

			for (const joiningTable of this.collectManyHasManyOwned(schema, entity)) {
				tables[joiningTable.name] = joiningTable
			}
		}

		return { tables }
	}

	private static buildDbColumnSchemaMap(schema: Schema, entity: Model.Entity): DbColumnSchemaMap {
		const columns: DbColumnSchemaMap = {}

		for (const field of Object.values(entity.fields)) {
			const column = acceptFieldVisitor(schema.model, entity, field, {
				visitColumn: (entity, column) => ({
					name: column.columnName,
					type: column.type,
					nullable: column.nullable,
				}),
				visitOneHasOneOwning: (entity, relation, targetEntity) => ({
					name: relation.joiningColumn.columnName,
					type: targetEntity.fields[targetEntity.primary].type as Model.ColumnType,
					nullable: relation.nullable,
				}),
				visitManyHasOne: (entity, relation, targetEntity) => ({
					name: relation.joiningColumn.columnName,
					type: targetEntity.fields[targetEntity.primary].type as Model.ColumnType,
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

	private static collectManyHasManyOwned(schema: Schema, entity: Model.Entity): DbTableSchema[] {
		const joiningTables = []

		for (const field of Object.values(entity.fields)) {
			const joiningTable = acceptFieldVisitor<DbTableSchema | null>(schema.model, entity, field, {
				visitColumn: () => null,
				visitOneHasOneOwning: () => null,
				visitManyHasOne: () => null,
				visitManyHasManyOwning: (entity, relation, targetEntity) => ({
					name: relation.joiningTable.tableName,
					columns: {
						[relation.joiningTable.joiningColumn.columnName]: {
							name: relation.joiningTable.joiningColumn.columnName,
							type: entity.fields[entity.primary].type as Model.ColumnType,
							nullable: false,
						},
						[relation.joiningTable.inverseJoiningColumn.columnName]: {
							name: relation.joiningTable.inverseJoiningColumn.columnName,
							type: targetEntity.fields[targetEntity.primary].type as Model.ColumnType,
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
