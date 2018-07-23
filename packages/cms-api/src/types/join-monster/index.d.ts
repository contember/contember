declare module 'join-monster'
{
  import { GraphQLResolveInfo } from "graphql";

  function joinMonster(resolveInfo: GraphQLResolveInfo, context: any, dbCall: (sql: string) => PromiseLike<any>, object?: { minify?: boolean, dialect?: string, dialectModule?: any }): PromiseLike<any>;

  export default joinMonster;
}

