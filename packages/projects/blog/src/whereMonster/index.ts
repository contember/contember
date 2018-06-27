import { acceptFieldVisitor, acceptRelationTypeVisitor, Entity, Schema } from "../model";
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

  private joins: string[][] = []

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

  join(joinPath: string[])
  {
    this.joins.push(joinPath)
    return this.alias(joinPath)
  }

  buildJoins(): string
  {
    let sqlExpr: string[] = []
    const joined: string[][] = []
    for (let joinPath of this.joins) {
      let currentFrom = this.rootEntity
      for (let i = 0; i < joinPath.length; i++) {
        const partialJoinPath = joinPath.slice(0, i + 1)

        const targetEntity = acceptFieldVisitor(this.schema, currentFrom, joinPath[i], {
          visitColumn: () => {
            throw new Error();
          },
          visitRelation: (entity, relation, targetEntity) => {
            return targetEntity
          }
        })

        if (joined.includes(partialJoinPath)) {
          currentFrom = targetEntity
          continue;
        }
        joined.push(partialJoinPath)

        const fromAlias = this.alias(joinPath.slice(0, i))
        const toAlias = this.alias(partialJoinPath)

        acceptRelationTypeVisitor(this.schema, currentFrom, joinPath[i], {
          visitOneHasOneOwner: (entity, relation, targetEntity) => {
            sqlExpr.push(`JOIN ${targetEntity.tableName} AS ${toAlias} ON ${toAlias}.${targetEntity.primary} = ${fromAlias}.${relation.joiningColumn.columnName}`)
          },
          visitOneHasOneInversed: (entity, relation, targetEntity, targetRelation) => {
            sqlExpr.push(`JOIN ${targetEntity.tableName} AS ${toAlias} ON ${toAlias}.${targetRelation.joiningColumn.columnName} = ${fromAlias}.${entity.primary}`)
          },
          visitManyHasOne: (entity, relation, targetEntity) => {
            sqlExpr.push(`JOIN ${targetEntity.tableName} AS ${toAlias} ON ${toAlias}.${targetEntity.primary} = ${fromAlias}.${relation.joiningColumn.columnName}`)
          },
          visitOneHasMany: (entity, relation, targetEntity, targetRelation) => {
            sqlExpr.push(`JOIN ${targetEntity.tableName} AS ${toAlias} ON ${toAlias}.${targetRelation.joiningColumn.columnName} = ${fromAlias}.${entity.primary}`)
          },
          visitManyHasManyOwner: (entity, relation, targetEntity) => {
            const joiningAlias = `${fromAlias}_x_${toAlias}`
            sqlExpr.push(`JOIN ${relation.joiningTable.tableName} AS ${joiningAlias} 
          ON ${joiningAlias}.${relation.joiningTable.joiningColumn.columnName} = ${fromAlias}.${currentFrom.primary}`)
            sqlExpr.push(`JOIN ${targetEntity.tableName}.${toAlias}
          ON ${toAlias}.${targetEntity.primary} = ${joiningAlias}.${relation.joiningTable.inverseJoiningColumn.columnName}`)
          },
          visitManyHasManyInversed: (entity, relation, targetEntity, targetRelation) => {
            const joiningAlias = `${fromAlias}_x_${toAlias}`
            sqlExpr.push(`JOIN ${targetRelation.joiningTable.tableName} AS ${joiningAlias} 
          ON ${joiningAlias}.${targetRelation.joiningTable.inverseJoiningColumn.columnName} = ${fromAlias}.${currentFrom.primary}`)
            sqlExpr.push(`JOIN ${targetEntity.tableName}.${toAlias}
          ON ${toAlias}.${targetEntity.primary} = ${joiningAlias}.${targetRelation.joiningTable.joiningColumn.columnName}`)
          },
        })
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


type JoinCallback = (joinPath: string[]) => string;

const buildWhere = (schema: Schema, entity: Entity, joinCallback: JoinCallback, joinPath: string[] = []) => (tableName: string, where: Where): string => {


  const buildWhereParts = (where: Where): string[] => {
    const parts: string[] = []
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

      parts.push(acceptFieldVisitor(schema, entity, fieldName, {
        visitColumn: (entity, column) => {
          const condition: Condition<any> = where[column.name];
          return buildCondition(tableName, column.columnName)(condition)
        },
        visitHasOne: (entity, relation, targetEntity) => {
          const newJoinPath = [...joinPath, fieldName]
          const alias = joinCallback(newJoinPath)
          return buildWhere(schema, targetEntity, joinCallback, newJoinPath)(alias, where[fieldName])
        },
        visitHasMany: (entity, relation, targetEntity) => {
          const subQueryBuilder = new SubQueryBuilder(schema, entity)
          const whereExpr = buildWhere(schema, targetEntity, subQueryBuilder.join.bind(subQueryBuilder), [fieldName])(subQueryBuilder.join([fieldName]), where[fieldName])
          return `${tableName}.${entity.primary} IN (${subQueryBuilder.getSql()} WHERE ${whereExpr})`
        }
      }))
    }

    return parts
  }


  return joinParts(buildWhereParts(where), 'AND')

}


export { buildWhere }
