import joinMonster from "join-monster";
import { Context } from "../types";
import { GraphQLFieldResolver } from "graphql";

const resolver: GraphQLFieldResolver<any, any> = (parent: any, args: any, context: Context, resolveInfo: any) => {
  return joinMonster(resolveInfo, context, (sql: string) => {
    return context.db.raw(sql)
  }, {dialect: 'pg'})
}

export default resolver
