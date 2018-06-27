import { acceptRelationTypeVisitor, Entity, getEntity, Relation, RelationByTypeVisitor, Schema } from "../model";
import { JoinMonsterRelation } from "../joinMonsterHelpers";

const createJoinMonsterRelation = (schema: Schema) => (entity: Entity) => (relation: Relation): JoinMonsterRelation<any, any> => {
  const targetEntity = getEntity(schema, relation.target)

  return acceptRelationTypeVisitor(schema, entity, relation.name, {
      visitOneHasOneOwner: (entity, relation) => {
        return {
          sqlJoin: (tableName, secondTableName) => {
            return `${tableName}.${relation.joiningColumn.columnName} = ${secondTableName}.${targetEntity.primary}`
          }
        }
      },
      visitOneHasOneInversed: (entity, relation, targetEntity, targetRelation) => {
        return {
          sqlJoin: (tableName, secondTableName) => {
            return `${tableName}.${entity.primary} = ${secondTableName}.${targetRelation.joiningColumn.columnName}`
          }
        }
      },
      visitManyHasManyOwner: (entity, relation, targetEntity) => {
        return {
          junction: {
            sqlTable: relation.joiningTable.tableName,
            uniqueKey: [relation.joiningTable.joiningColumn.columnName, relation.joiningTable.inverseJoiningColumn.columnName],
            sqlBatch: {
              parentKey: entity.primary,
              thisKey: relation.joiningTable.joiningColumn.columnName,
              sqlJoin: (tableName, targetTable) => {
                return `${tableName}.${relation.joiningTable.inverseJoiningColumn.columnName} = ${targetTable}.${targetEntity.primary}`
              }
            }
          }
        }
      },
      visitManyHasManyInversed: (entity, relation, targetEntity, targetRelation) => {
        return {
          junction: {
            sqlTable: targetRelation.joiningTable.tableName,
            uniqueKey: [targetRelation.joiningTable.joiningColumn.columnName, targetRelation.joiningTable.inverseJoiningColumn.columnName],
            sqlBatch: {
              parentKey: entity.primary,
              thisKey: targetRelation.joiningTable.inverseJoiningColumn.columnName,
              sqlJoin: (tableName, targetTable) => {
                return `${tableName}.${targetRelation.joiningTable.joiningColumn.columnName} = ${targetTable}.${targetEntity.primary}`
              }
            }
          }
        }
      },
      visitOneHasMany: (entity, relation, targetEntity, targetRelation) => {
        return {
          sqlBatch: {
            thisKey: targetRelation.joiningColumn.columnName,
            parentKey: entity.primary,
          },
        }
      },
      visitManyHasOne: (entity, relation): JoinMonsterRelation<any, any> => {
        return {
          sqlJoin: (tableName, secondTableName) => {
            return `${tableName}.${relation.joiningColumn.columnName} = ${secondTableName}.${targetEntity.primary}`
          }
        }
      },
    } as RelationByTypeVisitor<JoinMonsterRelation<any, any>>
  )
}


export default createJoinMonsterRelation;
