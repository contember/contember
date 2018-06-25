import { Entity, getEntity, isHasManyInversedRelation, isHasOneOwnerRelation, isManyHasManyOwnerRelation, isRelation, Relation, Schema } from "../model";
import { JoinMonsterRelation } from "../joinMonsterHelpers";

const createJoinMonsterRelation = (schema: Schema) => (entity: Entity) => (relation: Relation): JoinMonsterRelation<any, any> => {
  const targetEntity = getEntity(schema, relation.target)

  if (isHasOneOwnerRelation(relation)) {
    return {
      sqlJoin: (tableName, secondTableName) => {
        return `${tableName}.${relation.joiningColumn.columnName} = ${secondTableName}.${targetEntity.primary}`
      }
    }
  }
  if (isManyHasManyOwnerRelation(relation)) {
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
  }

  if (isHasManyInversedRelation(relation)) {
    const targetRelation = targetEntity.fields[relation.ownedBy]
    if (!isRelation(targetRelation)) {
      throw new Error('definition error')
    }

    if (isManyHasManyOwnerRelation(targetRelation)) {
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
    } else if (isHasOneOwnerRelation(targetRelation)) {
      return {
        sqlBatch: {
          thisKey: targetRelation.joiningColumn.columnName,
          parentKey: entity.primary,
        },

      }
    } else {
      throw new Error('definition error')
    }
  }

  throw new Error('not implemented')
}

export default createJoinMonsterRelation;
