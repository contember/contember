import { Model, Schema } from '@contember/schema'
import { acceptFieldVisitor } from '@contember/schema-utils'

export type PgSchema = { tables: PgTableSchemaMap }
export type PgTableSchemaMap = Record<string, PgTableSchema>
export type PgTableSchema = { name: string, columns: PgColumnSchemaMap }
export type PgColumnSchemaMap = Record<string, PgColumnSchema>
export type PgColumnSchema = { name: string, type: Model.ColumnType, nullable: boolean }

export class PgSchemaBuilder {
	static build(schema: Schema): PgSchema {
		const tables: Record<string, PgTableSchema> = {}

		for (const entity of Object.values(schema.model.entities)) {
			tables[entity.tableName] = {
				name: entity.tableName,
				columns: this.buildPgColumnSchemaMap(schema, entity),
			}

			for (const joiningTable of this.collectManyHasManyOwned(schema, entity)) {
				tables[joiningTable.name] = joiningTable
			}
		}

		return { tables }
	}

	private static buildPgColumnSchemaMap(schema: Schema, entity: Model.Entity): PgColumnSchemaMap {
		const columns: PgColumnSchemaMap = {}

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

	private static collectManyHasManyOwned(schema: Schema, entity: Model.Entity): PgTableSchema[] {
		const joiningTables = []

		for (const field of Object.values(entity.fields)) {
			const joiningTable = acceptFieldVisitor<PgTableSchema | null>(schema.model, entity, field, {
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
