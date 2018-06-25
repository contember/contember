import { Entity, getEntity, isField, isHasManyInversedRelation, isHasOneOwnerRelation, isManyHasManyOwnerRelation, isRelation, Schema } from "../model";
import { Condition, default as buildCondition } from "./conditionBuilder";
import { joinParts } from "./utils";


type ComposedWhere = {
  and?: Where[]
  or?: Where[]
  not?: Where
}

//workaround
type FieldWhere = { [name: string]: Condition<any> | any }

type Where = ComposedWhere & FieldWhere & any


class SubQueryBuilder
{
  schema: Schema;
  rootEntity: Entity;

  private wheres: {
    joinPath: string[],
    field: string,
    condition: Condition<any>,
  }[] = []

  constructor(schema: Schema, rootEntity: Entity)
  {
    this.schema = schema;
    this.rootEntity = rootEntity;
  }



  getSql(): string
  {
    const rootAlias = this.alias([])
    const joins = this.buildJoins()
    return `SELECT ${this.rootEntity.primary} 
    FROM ${this.rootEntity.tableName} AS ${rootAlias}
   ${joins}
    `
  }

  buildJoins(): string
  {
    let sqlExpr: string[] = []
    const joined: string[][] = []
    for (let where of this.wheres) {
      let currentFrom = this.rootEntity
      for (let i = 0; i < where.joinPath.length; i++) {
        const partialJoinPath = where.joinPath.slice(0, i + 1)
        const relation = currentFrom.fields[where.joinPath[i]];
        if (!isRelation(relation)) {
          throw new Error()
        }
        const targetEntity = getEntity(this.schema, relation.target);

        if (joined.includes(partialJoinPath)) {
          currentFrom = targetEntity
          continue;
        }
        const fromAlias = this.alias(where.joinPath.slice(0, i))
        const toAlias = this.alias(partialJoinPath)
        if (isHasOneOwnerRelation(relation)) {
          sqlExpr.push(`JOIN ${targetEntity.tableName} AS ${toAlias} ON ${toAlias}.${targetEntity.primary} = ${fromAlias}.${relation.joiningColumn.columnName}`)
        } else if (isManyHasManyOwnerRelation(relation)) {
          const joiningAlias = `${fromAlias}_x_${toAlias}`
          sqlExpr.push(`JOIN ${relation.joiningTable.tableName} AS ${joiningAlias} 
          ON ${joiningAlias}.${relation.joiningTable.joiningColumn.columnName} = ${fromAlias}.${currentFrom.primary}`)
          sqlExpr.push(`JOIN ${targetEntity.tableName}.${toAlias}
          ON ${toAlias}.${targetEntity.primary} = ${joiningAlias}.${relation.joiningTable.inverseJoiningColumn.columnName}`)
        } else if (isHasManyInversedRelation(relation)) {
          const targetRelation = targetEntity.fields[relation.ownedBy]
          if (!isRelation(targetRelation)) {
            throw new Error('definition error')
          }

          if (isManyHasManyOwnerRelation(targetRelation)) {
            const joiningAlias = `${fromAlias}_x_${toAlias}`
            sqlExpr.push(`JOIN ${targetRelation.joiningTable.tableName} AS ${joiningAlias} 
          ON ${joiningAlias}.${targetRelation.joiningTable.inverseJoiningColumn.columnName} = ${fromAlias}.${currentFrom.primary}`)
            sqlExpr.push(`JOIN ${targetEntity.tableName}.${toAlias}
          ON ${toAlias}.${targetEntity.primary} = ${joiningAlias}.${targetRelation.joiningTable.joiningColumn.columnName}`)
          } else if (isHasOneOwnerRelation(targetRelation)) {
            sqlExpr.push(`JOIN ${targetEntity.tableName} AS ${toAlias} ON ${toAlias}.${targetRelation.joiningColumn.columnName} = ${fromAlias}.${targetEntity.primary}`)
          } else {
            throw new Error('definition error')
          }
        }


        joined.push(partialJoinPath)
        currentFrom = targetEntity
      }
    }
    return sqlExpr.join("\n")
  }


  alias(path: string[])
  {
    return "root_" + path.join('_')
  }
}


const buildSubQuery = (schema: Schema, entity: Entity) => (relationName: string, relationWhere: Where) => {
  const relation = entity.fields[relationName]
  if (!isRelation(relation)) {
    throw new Error()
  }

}

const buildWhere = (schema: Schema, entity: Entity) => (tableName: string, where: Where): string => {


  const buildWhereParts = (where: Where): string[] => {
    const parts = []
    if (where.and !== undefined) {
      parts.push(joinParts(where.and.map((where: Where) => joinParts(buildWhereParts(where), 'AND')), 'AND'))
    }
    if (where.or !== undefined) {
      parts.push(joinParts(where.or.map((where: Where) => joinParts(buildWhereParts(where), 'OR')), 'OR'))
    }
    if (where.not !== undefined) {
      parts.push(joinParts(buildWhereParts(where.not), 'AND', true))
    }
    for (let fieldName in where) {
      if (fieldName === 'and' || fieldName === 'or' || fieldName === 'not') {
        continue
      }
      let field = entity.fields[fieldName];
      if (!field) {
        throw new Error('Field ' + fieldName + ' not found')
      }

      if (isField(field)) {
        const condition: Condition<any> = where[fieldName];
        parts.push(buildCondition(tableName, field.columnName)(condition))
      } else if (isRelation(field)) {

      } else {
        throw new Error('impl error')
      }
    }

    return parts
  }


  return joinParts(buildWhereParts(where), 'AND')

}


export { buildWhere }
