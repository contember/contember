import { isSqlAstTableNode, Join, SqlAstNode, SqlAstTableNode } from "../joinMonsterHelpers"
import { Entity, RelationByTypeVisitor, Schema } from "../schema/model"
import { acceptFieldVisitor, acceptRelationTypeVisitor, getEntity } from "../schema/modelUtils"
import { createAlias, quoteIdentifier } from "../sql/utils"

const aliasInAst = (sqlAstNode: SqlAstNode) => {
  const usedNames: string[] = []
  const visitNode = (sqlAstNode: SqlAstNode) => {
    if (isSqlAstTableNode(sqlAstNode) && sqlAstNode.as) {
      usedNames.push(sqlAstNode.as)
    }
    if (sqlAstNode.children) {
      (sqlAstNode.children as any[]).forEach(it => visitNode(it))
    }
  }
  visitNode(sqlAstNode)

  return createAlias(usedNames)
}

const joinToAst = (schema: Schema, createAlias: (name: string) => string) => {
  const joiner = (sqlAstNode: SqlAstNode, entity: Entity) => (joinPath: string[]): string => {
    const fieldName = joinPath[0]
    let subNode: SqlAstTableNode = sqlAstNode.children.find(it => isSqlAstTableNode(it) && it.fieldName === fieldName) as SqlAstTableNode
    if (!subNode) {
      const notSupported = () => {
        throw new Error("Only has one relation can be joined this way")
      }
      const createChildren = (entity: Entity) => {
        return [
          {
            type: "column",
            name: entity.primary,
            fieldName: acceptFieldVisitor(schema, entity, entity.primary, {
              visitRelation: () => {
                throw new Error()
              },
              visitColumn: (entity, column) => column.columnName,
            }),
            as: "primary"
          } as any
        ]
      }
      const joiningInfo = acceptRelationTypeVisitor(schema, entity, fieldName, {
        visitManyHasManyInversed: notSupported,
        visitManyHasManyOwner: notSupported,
        visitOneHasMany: notSupported,

        visitManyHasOne: (entity, relation, targetEntity, targetRelation) => {
          return {
            name: quoteIdentifier(targetEntity.tableName),
            children: createChildren(targetEntity),
            sqlJoin: (t1, t2) => `${t1}.${relation.joiningColumn.columnName} = ${t2}.${targetEntity.primaryColumn}`
          }
        },
        visitOneHasOneOwner: (entity, relation, targetEntity, targetRelation) => {
          return {
            name: quoteIdentifier(targetEntity.tableName),
            children: createChildren(targetEntity),
            sqlJoin: (t1, t2) => `${t1}.${relation.joiningColumn.columnName} = ${t2}.${targetEntity.primaryColumn}`
          }
        },
        visitOneHasOneInversed: (entity, relation, targetEntity, targetRelation) => {
          return {
            name: quoteIdentifier(targetEntity.tableName),
            children: createChildren(targetEntity),
            sqlJoin: (t1, t2) => `${t1}.${entity.primaryColumn} = ${t2}.${targetRelation.joiningColumn.columnName}`
          }
        }
      } as RelationByTypeVisitor<{ name: string, sqlJoin: Join, children: SqlAstNode[] }>)
      subNode = {
        args: {},
        type: "table",
        as: createAlias(fieldName),
        fieldName,
        grabMany: false,
        ...joiningInfo
      }
      sqlAstNode.children.push(subNode)
    }
    if (joinPath.length > 1) {
      return joiner(subNode, getEntity(schema, subNode.name))(joinPath.slice(1))
    }
    return subNode.as
  }

  return joiner
}
export { aliasInAst, joinToAst }
