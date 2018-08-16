import { GraphQLInputObjectType } from "graphql"
import { aliasInAst, joinToAst } from "../../joinMonster/sqlAstNodeUtils"
import { JoinMonsterFieldMapping } from "../../joinMonsterHelpers"
import { Model, Input } from "cms-common"
import { quoteIdentifier } from "../../sql/utils"
import { buildWhere } from "../../whereMonster"
import WhereTypeProvider from "../WhereTypeProvider"

type JoinMonsterFieldMappingWithWhere = JoinMonsterFieldMapping<any, any> & { args?: { where: { type: GraphQLInputObjectType } } }
export default class JoinMonsterFieldMappingVisitor
  implements Model.ColumnVisitor<JoinMonsterFieldMapping<any, any>>,
    Model.RelationByTypeVisitor<JoinMonsterFieldMappingWithWhere>
{
  private schema: Model.Schema
  private whereTypeProvider: WhereTypeProvider

  constructor(schema: Model.Schema, whereTypeProvider: WhereTypeProvider)
  {
    this.schema = schema
    this.whereTypeProvider = whereTypeProvider
  }

  public visitColumn(entity: Model.Entity, column: Model.AnyColumn): JoinMonsterFieldMapping<any, any>
  {
    return {
      sqlColumn: column.columnName,
    }
  }

  public visitManyHasManyInversed(
    entity: Model.Entity,
    relation: Model.ManyHasManyInversedRelation,
    targetEntity: Model.Entity,
    targetRelation: Model.ManyHasManyOwnerRelation
  ): JoinMonsterFieldMappingWithWhere
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

  public visitManyHasManyOwner(
    entity: Model.Entity,
    relation: Model.ManyHasManyOwnerRelation,
    targetEntity: Model.Entity,
    targetRelation: Model.ManyHasManyInversedRelation | null
  ): JoinMonsterFieldMappingWithWhere
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

  public visitManyHasOne(
    entity: Model.Entity,
    relation: Model.ManyHasOneRelation,
    targetEntity: Model.Entity,
    targetRelation: Model.OneHasManyRelation | null
  ): JoinMonsterFieldMapping<any, any>
  {
    return {
      sqlJoin: (tableName, secondTableName) => {
        return `${tableName}.${relation.joiningColumn.columnName} = ${secondTableName}.${targetEntity.primaryColumn}`
      }
    }
  }

  public visitOneHasMany(
    entity: Model.Entity,
    relation: Model.OneHasManyRelation,
    targetEntity: Model.Entity,
    targetRelation: Model.ManyHasOneRelation
  ): JoinMonsterFieldMappingWithWhere
  {
    return {
      sqlBatch: {
        thisKey: targetRelation.joiningColumn.columnName,
        parentKey: entity.primaryColumn,
      },
      ...this.getHasManyMapping(relation, targetEntity),
    }
  }

  public visitOneHasOneInversed(
    entity: Model.Entity,
    relation: Model.OneHasOneInversedRelation,
    targetEntity: Model.Entity,
    targetRelation: Model.OneHasOneOwnerRelation
  ): JoinMonsterFieldMapping<any, any>
  {
    return {
      sqlJoin: (tableName, secondTableName) => {
        return `${tableName}.${entity.primaryColumn} = ${secondTableName}.${targetRelation.joiningColumn.columnName}`
      },
    }
  }

  public visitOneHasOneOwner(
    entity: Model.Entity,
    relation: Model.OneHasOneOwnerRelation,
    targetEntity: Model.Entity,
    targetRelation: Model.OneHasOneInversedRelation | null
  ): JoinMonsterFieldMapping<any, any>
  {
    return {
      sqlJoin: (tableName, secondTableName) => {
        return `${tableName}.${relation.joiningColumn.columnName} = ${secondTableName}.${targetEntity.primaryColumn}`
      },
    }
  }

  public getHasManyMapping(relation: Model.Relation, targetEntity: Model.Entity)
  {
    return {
      args: {
        where: {type: this.whereTypeProvider.getEntityWhereType(relation.target)},
      },
      where: (tableAlias: string, args: { where: Input.Where }, context: any, sqlAstNode: any) => {
        const createAlias = aliasInAst(sqlAstNode)
        return buildWhere(this.schema, targetEntity, joinToAst(this.schema, createAlias)(sqlAstNode, targetEntity))(tableAlias, args.where || {})
      },
    }
  }
}
