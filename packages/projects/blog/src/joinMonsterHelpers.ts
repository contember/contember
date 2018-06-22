export interface JoinMonsterEntityMapping
{
  sqlTable: string
  uniqueKey: string | string[]
}

type JoinedRelation<TArgs = { [argName: string]: any }> = {
  sqlJoin: (tableName: string, secondTableName: string, args: TArgs) => string
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

export type JoinMonsterFieldMapping<TContext, TArgs = { [argName: string]: any }> = {
  where?: (tableName: string, args: TArgs, context: TContext) => (string | Promise<string>)
  orderBy?: { [columns: string]: 'asc' | 'desc' }
} & ({
  sqlColumn: string
} | {
  sqlDeps: string[]
} | {
  sqlExpr: (string | Promise<string>)
} | JoinMonsterRelation<TContext, TArgs> | {})

