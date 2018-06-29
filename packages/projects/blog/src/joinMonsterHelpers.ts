export interface JoinMonsterEntityMapping
{
  sqlTable: string
  uniqueKey: string | string[]
}

export type Join = (tableName: string, secondTableName: string, args: any) => string
type JoinedRelation<TArgs = { [argName: string]: any }> = {
  sqlJoin: Join
}

type BatchedRelation = {
  sqlBatch: {
    thisKey: string,
    parentKey: string,
  }
}

type JoinedJunction<TArgs> = {
  sqlJoins: [
    (tableName: string, junctionTableName: string, args: TArgs) => string,
    (junctionTableName: string, inversedTableName: string, args: TArgs) => string
    ],
}

type BatchedJunction = {
  sqlBatch: {
    thisKey: string,
    parentKey: string,
    sqlJoin: (junctionTableName: string, inversedTableName: string) => string,
  }
}

type Junction<TContext, TArgs> = {
  junction: {
    sqlTable: string,
    where?: (junctionTableName: string, args: TArgs, context: TContext) => (string | Promise<string>),
    orderBy?: { [columns: string]: 'asc' | 'desc' },
  } & (JoinedJunction<TArgs> | BatchedJunction)
}

export type JoinMonsterRelation<TContext, TArgs = { [argName: string]: any }> = JoinedRelation | BatchedRelation | Junction<TContext, TArgs>

type Where = (tableName: string, args: any, context: any, sqlAstNode: any) => (string | Promise<string>)
export type JoinMonsterFieldMapping<TContext, TArgs = { [argName: string]: any }> = {
  where?: Where,
  orderBy?: { [columns: string]: 'asc' | 'desc' }
} & ({
  sqlColumn: string
} | {
  sqlDeps: string[]
} | {
  sqlExpr: (string | Promise<string>)
} | JoinMonsterRelation<TContext, TArgs> | {})


//incomplete
export interface SqlAstTableNode
{
  args: any
  type: 'table',
  name: string,
  as: string,
  orderBy?: { [column: string]: 'DESC' | 'ASC' },
  children: SqlAstNode[],
  fieldName: string,
  where?: Where,
  sqlJoin?: Join,
  grabMany: boolean
}

export const isSqlAstTableNode = (node: SqlAstNode): node is SqlAstTableNode => node.type === 'table'

export type SqlAstNode = SqlAstTableNode | { type: string, children: SqlAstNode[] }

