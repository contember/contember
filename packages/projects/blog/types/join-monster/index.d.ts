declare module 'join-monster'
{
  import { GraphQLResolveInfo } from "graphql";

  function joinMonster(resolveInfo: GraphQLResolveInfo, context: any, dbCall: (sql: string) => Promise<any>, object?: { minify?: boolean, dialect?: string, dialectModule?: any }): Promise<any>;

  export default joinMonster;
}

