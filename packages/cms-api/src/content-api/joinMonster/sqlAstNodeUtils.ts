import { isSqlAstTableNode, Join, SqlAstNode, SqlAstTableNode } from "../joinMonsterHelpers"
import { Model } from "cms-common"
import { acceptFieldVisitor, acceptRelationTypeVisitor, getEntity } from "../../content-schema/modelUtils"
import { createAlias, quoteIdentifier } from "../sql/utils"

const aliasInAst = (sqlAstNode: SqlAstNode) => {
  const usedNames: string[] = []

  const visitNode = (node: SqlAstNode) => {
    if (isSqlAstTableNode(node) && node.as) {
      usedNames.push(node.as)
    }
    if (node.children) {
      (node.children as any[]).forEach(it => visitNode(it))
    }
  }
  visitNode(sqlAstNode)

  return createAlias(usedNames)
}

interface JoiningInfo { name: string, sqlJoin: Join, children: SqlAstNode[] }

const notSupported = (): never => {
  throw new Error("Only has one relation can be joined this way")
}

class NodeJoiningInfoVisitor implements Model.RelationByTypeVisitor<JoiningInfo | never>
{
  private schema: Model.Schema

  constructor(schema: Model.Schema)
  {
    this.schema = schema
  }

  public visitManyHasManyInversed = notSupported
  public visitManyHasManyOwner = notSupported
  public visitOneHasMany = notSupported

  public visitManyHasOne(entity: Model.Entity, relation: Model.ManyHasOneRelation, targetEntity: Model.Entity, targetRelation: Model.OneHasManyRelation | null): JoiningInfo
  {
    return {
      name: quoteIdentifier(targetEntity.tableName),
      children: this.createChildren(targetEntity),
      sqlJoin: (t1, t2) => `${t1}.${relation.joiningColumn.columnName} = ${t2}.${targetEntity.primaryColumn}`
    }
  }

  public visitOneHasOneInversed(entity: Model.Entity, relation: Model.OneHasOneInversedRelation, targetEntity: Model.Entity, targetRelation: Model.OneHasOneOwnerRelation): JoiningInfo
  {
    return {
      name: quoteIdentifier(targetEntity.tableName),
      children: this.createChildren(targetEntity),
      sqlJoin: (t1, t2) => `${t1}.${entity.primaryColumn} = ${t2}.${targetRelation.joiningColumn.columnName}`
    }
  }

  public visitOneHasOneOwner(entity: Model.Entity, relation: Model.OneHasOneOwnerRelation, targetEntity: Model.Entity, targetRelation: Model.OneHasOneInversedRelation | null): JoiningInfo
  {
    return {
      name: quoteIdentifier(targetEntity.tableName),
      children: this.createChildren(targetEntity),
      sqlJoin: (t1, t2) => `${t1}.${relation.joiningColumn.columnName} = ${t2}.${targetEntity.primaryColumn}`
    }
  }

  private createChildren(entity: Model.Entity): SqlAstNode[]
  {
    return [
      {
        type: "column",
        name: entity.primary,
        fieldName: acceptFieldVisitor(this.schema, entity, entity.primary, {
          visitRelation: () => {
            throw new Error()
          },
          visitColumn: (entity, column) => column.columnName,
        }),
        as: "primary",
        children: []
      }
    ]
  }

}

const joinToAst = (schema: Model.Schema, createAlias: (name: string) => string) => {
  const joiner = (sqlAstNode: SqlAstNode, entity: Model.Entity) => (joinPath: string[]): string => {
    const fieldName = joinPath[0]
    let subNode: SqlAstTableNode = sqlAstNode.children.find(it => isSqlAstTableNode(it) && it.fieldName === fieldName) as SqlAstTableNode
    if (!subNode) {
      const nodeJoiningInfoVisitor = new NodeJoiningInfoVisitor(schema)
      const joiningInfo = acceptRelationTypeVisitor(schema, entity, fieldName, nodeJoiningInfoVisitor)
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
