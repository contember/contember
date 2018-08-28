import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate'
import { Model } from 'cms-common'
import { acceptFieldVisitor, getColumnName } from '../../content-schema/modelUtils'

const buildSqlSchema = (schema: Model.Schema, migrationBuilder: MigrationBuilder) => {
	const getPrimaryType = (entity: Model.Entity) => {
		return acceptFieldVisitor(schema, entity, entity.primary, {
			visitColumn: (entity, column) => column.columnType,
			visitRelation: () => {
				throw new Error()
			}
		})
	}

	for (const enumName in schema.enums) {
		const values = schema.enums[enumName]
		migrationBuilder.createType(enumName, values)
	}

	for (const entityName in schema.entities) {
		const entity = schema.entities[entityName]
		const columns: ColumnDefinitions = {}
		for (const fieldName in entity.fields) {
			acceptFieldVisitor(schema, entity, fieldName, {
				visitColumn: (entity, column) => {
					columns[column.columnName] = {
						primaryKey: entity.primary === column.name,
						type: column.type === Model.ColumnType.Enum ? `"${column.columnType}"` : column.columnType,
						notNull: !column.nullable
					}
				},
				visitManyHasManyInversed: () => {},
				visitManyHasManyOwner: (entity, relation, targetEntity) => {
					migrationBuilder.createTable(
						relation.joiningTable.tableName,
						{
							[relation.joiningTable.joiningColumn.columnName]: {
								type: getPrimaryType(entity),
								notNull: true
							},
							[relation.joiningTable.inverseJoiningColumn.columnName]: {
								type: getPrimaryType(targetEntity),
								notNull: true
							}
						},
						{
							constraints: {
								primaryKey: [
									relation.joiningTable.joiningColumn.columnName,
									relation.joiningTable.inverseJoiningColumn.columnName
								]
							}
						}
					)
				},
				visitOneHasOneOwner: (entity, relation, targetEntity) => {
					columns[relation.joiningColumn.columnName] = {
						type: getPrimaryType(targetEntity),
						notNull: !relation.nullable
					}
				},
				visitOneHasOneInversed: () => {},
				visitManyHasOne: (entity, relation, targetEntity) => {
					columns[relation.joiningColumn.columnName] = {
						type: acceptFieldVisitor(schema, targetEntity, targetEntity.primary, {
							visitColumn: (entity, column) => column.columnType,
							visitRelation: () => {
								throw new Error()
							}
						}),
						notNull: !relation.nullable
					}
				},
				visitOneHasMany: () => {}
			})
		}
		migrationBuilder.createTable(entity.tableName, columns)
	}

	for (const entityName in schema.entities) {
		const entity = schema.entities[entityName]

		for (const uniqueName in entity.unique) {
			const unique = entity.unique[uniqueName]
			migrationBuilder.createIndex(entity.tableName, unique.fields.map(name => getColumnName(schema, entity, name)), {
				unique: true
			})
		}

		for (const fieldName in entity.fields) {
			acceptFieldVisitor(schema, entity, fieldName, {
				visitColumn: () => {},
				visitManyHasManyInversed: () => {},
				visitManyHasManyOwner: (entity, relation, targetEntity) => {
					migrationBuilder.createConstraint(
						relation.joiningTable.tableName,
						`fk_${relation.joiningTable.tableName}_${entity.name}`,
						{
							foreignKeys: {
								columns: relation.joiningTable.joiningColumn.columnName,
								references: `"${entity.tableName}"(${entity.primary})`,
								onDelete: 'cascade'
							}
						}
					)
					migrationBuilder.createConstraint(
						relation.joiningTable.tableName,
						`fk_${relation.joiningTable.tableName}_${targetEntity.name}`,
						{
							foreignKeys: {
								columns: relation.joiningTable.inverseJoiningColumn.columnName,
								references: `"${targetEntity.tableName}"(${entity.primary})`,
								onDelete: 'cascade'
							}
						}
					)
				},
				visitOneHasOneOwner: (entity, relation, targetEntity) => {
					if (!Object.values(entity.unique).find(it => it.fields.length === 1 && it.fields[0] === relation.name)) {
						migrationBuilder.createIndex(entity.tableName, relation.joiningColumn.columnName, { unique: true })
					}

					migrationBuilder.createConstraint(entity.tableName, `fk_${entity.tableName}_${relation.name}`, {
						foreignKeys: {
							columns: relation.joiningColumn.columnName,
							references: `"${targetEntity.tableName}"(${targetEntity.primary})`,
							onDelete: relation.joiningColumn.onDelete
						}
					})
				},
				visitOneHasOneInversed: () => {},
				visitManyHasOne: (entity, relation, targetEntity) => {
					migrationBuilder.createIndex(entity.tableName, relation.joiningColumn.columnName)
					migrationBuilder.createConstraint(entity.tableName, `fk_${entity.tableName}_${relation.name}`, {
						foreignKeys: {
							columns: relation.joiningColumn.columnName,
							references: `"${targetEntity.tableName}"(${targetEntity.primary})`,
							onDelete: relation.joiningColumn.onDelete
						}
					})
				},
				visitOneHasMany: () => {}
			})
		}
	}
}

export default buildSqlSchema
