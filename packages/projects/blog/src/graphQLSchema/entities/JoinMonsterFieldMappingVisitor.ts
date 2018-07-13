import { GraphQLInputObjectType } from "graphql"
import { aliasInAst, joinToAst } from "../../joinMonster/sqlAstNodeUtils"
import { JoinMonsterFieldMapping } from "../../joinMonsterHelpers"
import { Where } from "../../schema/input"
import {
  Column,
  ColumnVisitor,
  Entity,
  ManyHasManyInversedRelation,
  ManyHasManyOwnerRelation,
  ManyHasOneRelation,
  OneHasManyRelation,
  OneHasOneInversedRelation,
  OneHasOneOwnerRelation,
  Relation,
  RelationByTypeVisitor,
  Schema
} from "../../schema/model"
import { quoteIdentifier } from "../../sql/utils"
import { buildWhere } from "../../whereMonster"
import WhereTypeProvider from "../WhereTypeProvider"

export default class JoinMonsterFieldMappingVisitor implements ColumnVisitor<JoinMonsterFieldMapping<any, any>>, RelationByTypeVisitor<JoinMonsterFieldMapping<any, any> & { args?: { where: { type: GraphQLInputObjectType } } }>
{
  private schema: Schema
  private whereTypeProvider: WhereTypeProvider

  constructor(schema: Schema, whereTypeProvider: WhereTypeProvider)
  {
    this.schema = schema
    this.whereTypeProvider = whereTypeProvider
  }

  public visitColumn(entity: Entity, column: Column): JoinMonsterFieldMapping<any, any>
  {
    return {
      sqlColumn: column.columnName,
    }
  }

  public visitManyHasManyInversed(entity: Entity, relation: ManyHasManyInversedRelation, targetEntity: Entity, targetRelation: ManyHasManyOwnerRelation): JoinMonsterFieldMapping<any, any> & { args?: { where: { type: GraphQLInputObjectType } } }
  {
    return {
      junction: {
        sqlTable: quoteIdentifier(targetRelation.joiningTable.tableName),
        uniqueKey: [targetRelation.joiningTable.joiningColumn.columnName, targetRelation.joiningTable.inverseJoiningColumn.columnName],
        sqlBatch: {
          parentKey: entity.primaryColumn,
          thisKey: targetRelation.joiningTable.inverseJoiningColumn.columnName,
          sqlJoin: (tableName, targetTable) => {
            return `${tableName}.${targetRelation.joiningTable.joiningColumn.columnName} = ${targetTable}.${targetEntity.primaryColumn}`
          }
        }
      },
      ...this.getHasManyMapping(relation, targetEntity),
    }
  }

  public visitManyHasManyOwner(entity: Entity, relation: ManyHasManyOwnerRelation, targetEntity: Entity, targetRelation: ManyHasManyInversedRelation | null): JoinMonsterFieldMapping<any, any> & { args?: { where: { type: GraphQLInputObjectType } } }
  {
    return {
      junction: {
        sqlTable: quoteIdentifier(relation.joiningTable.tableName),
        uniqueKey: [relation.joiningTable.joiningColumn.columnName, relation.joiningTable.inverseJoiningColumn.columnName],
        sqlBatch: {
          parentKey: entity.primaryColumn,
          thisKey: relation.joiningTable.joiningColumn.columnName,
          sqlJoin: (tableName, targetTable) => {
            return `${tableName}.${relation.joiningTable.inverseJoiningColumn.columnName} = ${targetTable}.${targetEntity.primaryColumn}`
          }
        }
      },
      ...this.getHasManyMapping(relation, targetEntity),
    }
  }

  public visitManyHasOne(entity: Entity, relation: ManyHasOneRelation, targetEntity: Entity, targetRelation: OneHasManyRelation | null): JoinMonsterFieldMapping<any, any>
  {
    return {
      sqlJoin: (tableName, secondTableName) => {
        return `${tableName}.${relation.joiningColumn.columnName} = ${secondTableName}.${targetEntity.primaryColumn}`
      }
    }
  }

  public visitOneHasMany(entity: Entity, relation: OneHasManyRelation, targetEntity: Entity, targetRelation: ManyHasOneRelation)
  {
    return {
      sqlBatch: {
        thisKey: targetRelation.joiningColumn.columnName,
        parentKey: entity.primaryColumn,
      },
      ...this.getHasManyMapping(relation, targetEntity),
    }
  }

  public visitOneHasOneInversed(entity: Entity, relation: OneHasOneInversedRelation, targetEntity: Entity, targetRelation: OneHasOneOwnerRelation): JoinMonsterFieldMapping<any, any>
  {
    return {
      sqlJoin: (tableName, secondTableName) => {
        return `${tableName}.${entity.primaryColumn} = ${secondTableName}.${targetRelation.joiningColumn.columnName}`
      },
    }
  }

  public visitOneHasOneOwner(entity: Entity, relation: OneHasOneOwnerRelation, targetEntity: Entity, targetRelation: OneHasOneInversedRelation | null): JoinMonsterFieldMapping<any, any>
  {
    return {
      sqlJoin: (tableName, secondTableName) => {
        return `${tableName}.${relation.joiningColumn.columnName} = ${secondTableName}.${targetEntity.primaryColumn}`
      },
    }
  }

  public getHasManyMapping(relation: Relation, targetEntity: Entity)
  {
    return {
      args: {
        where: {type: this.whereTypeProvider.getEntityWhereType(relation.target)},
      },
      where: (tableAlias: string, args: { where: Where }, context: any, sqlAstNode: any) => {
        const createAlias = aliasInAst(sqlAstNode)
        return buildWhere(this.schema, targetEntity, joinToAst(this.schema, createAlias)(sqlAstNode, targetEntity))(tableAlias, args.where || {})
      },
    }
  }
}
