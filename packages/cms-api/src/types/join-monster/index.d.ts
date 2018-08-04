declare module 'join-monster' {
  import {GraphQLResolveInfo} from 'graphql'
  export default function joinMonster(
    resolveInfo: GraphQLResolveInfo,
    context: any,
    dbCall: (sql: string) => PromiseLike<any>,
    object?: { minify?: boolean, dialect?: string, dialectModule?: any }
  ): PromiseLike<any>;
}
