import { Entity, Schema } from '../schema/model'
import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate'
import { acceptFieldVisitor } from "../schema/modelUtils";

const buildSqlSchema = (schema: Schema, migrationBuilder: MigrationBuilder) => {
  const getPrimaryType = (entity: Entity) => {
    return acceptFieldVisitor(schema, entity, entity.primary, {
      visitColumn: (entity, column) => column.type,
      visitRelation: () => {
        throw new Error()
      },
    })
  }

  for (let enumName in schema.enums) {
    const values = schema.enums[enumName]
    migrationBuilder.createType(enumName, values)
  }

  for (let entityName in schema.entities) {
    const entity = schema.entities[entityName]
    const columns: ColumnDefinitions = {}
    for (let fieldName in entity.fields) {
      acceptFieldVisitor(schema, entity, fieldName, {
          visitColumn: (entity, column) => {
            columns[column.columnName] = {
              primaryKey: entity.primary === column.name,
              type: schema.enums[column.type] !== undefined ? `"${column.type}"` : column.type,
              notNull: !column.nullable,
            }
          },
          visitManyHasManyInversed: () => {
          },
          visitManyHasManyOwner: (entity, relation, targetEntity) => {
            migrationBuilder.createTable(relation.joiningTable.tableName, {
              [relation.joiningTable.joiningColumn.columnName]: {
                type: getPrimaryType(entity),
                notNull: true
              },
              [relation.joiningTable.inverseJoiningColumn.columnName]: {
                type: getPrimaryType(targetEntity),
                notNull: true,
              }
            }, {
              constraints: {
                primaryKey: [
                  relation.joiningTable.joiningColumn.columnName,
                  relation.joiningTable.inverseJoiningColumn.columnName,
                ]
              }
            })
          },
          visitOneHasOneOwner: (entity, relation, targetEntity) => {
            columns[relation.joiningColumn.columnName] = {
              type: getPrimaryType(targetEntity),
              notNull: !relation.nullable,
            }
          },
          visitOneHasOneInversed: () => {

          },
          visitManyHasOne: (entity, relation, targetEntity) => {
            columns[relation.joiningColumn.columnName] = {
              type: acceptFieldVisitor(schema, targetEntity, targetEntity.primary, {
                visitColumn: (entity, column) => column.type,
                visitRelation: () => {
                  throw new Error()
                },
              }),
              notNull: !relation.nullable,
            }
          },
          visitOneHasMany: () => {

          },
        },
      )
    }
    migrationBuilder.createTable(entity.tableName, columns)
  }


  for (let entityName in schema.entities) {
    const entity = schema.entities[entityName]
    for (let fieldName in entity.fields) {
      acceptFieldVisitor(schema, entity, fieldName, {
          visitColumn: () => {
          },
          visitManyHasManyInversed: () => {
          },
          visitManyHasManyOwner: (entity, relation, targetEntity) => {
            migrationBuilder.createConstraint(relation.joiningTable.tableName, `fk_${relation.joiningTable.tableName}_${entity.name}`, {
              foreignKeys: {
                columns: relation.joiningTable.joiningColumn.columnName,
                references: `"${entity.tableName}"(${entity.primary})`,
              }
            })
            migrationBuilder.createConstraint(relation.joiningTable.tableName, `fk_${relation.joiningTable.tableName}_${targetEntity.name}`, {
              foreignKeys: {
                columns: relation.joiningTable.inverseJoiningColumn.columnName,
                references: `"${targetEntity.tableName}"(${entity.primary})`,
              }
            })
          },
          visitOneHasOneOwner: (entity, relation, targetEntity) => {
            migrationBuilder.createIndex(entity.tableName, relation.joiningColumn.columnName, {unique: true})
            migrationBuilder.createConstraint(entity.tableName, `fk_${entity.tableName}_${relation.name}`, {
              foreignKeys: {
                columns: relation.joiningColumn.columnName,
                references: `"${targetEntity.tableName}"(${targetEntity.primary})`
              }
            })
          },
          visitOneHasOneInversed: () => {
          },
          visitManyHasOne: (entity, relation, targetEntity) => {
            migrationBuilder.createIndex(entity.tableName, relation.joiningColumn.columnName)
            migrationBuilder.createConstraint(entity.tableName, `fk_${entity.tableName}_${relation.name}`, {
              foreignKeys: {
                columns: relation.joiningColumn.columnName,
                references: `"${targetEntity.tableName}"(${targetEntity.primary})`
              }
            })
          },
          visitOneHasMany: () => {
          },
        },
      )
    }
  }
}

export default buildSqlSchema
