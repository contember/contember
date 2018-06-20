import  {
  GraphQLInterfaceType,
  GraphQLInt,
  GraphQLString
} from 'graphql'


export default new GraphQLInterfaceType({
  name: 'AuthoredInterface',
  sqlTable: `(
    SELECT
      id,
      body,
      author_id,
      NULL as post_id, -- posts dont have post_id, so add NULL as a filler to allow us to UNION with comments
      'Post' AS "$type"
    FROM posts
    UNION ALL
    SELECT
      id,
      body,
      author_id,
      post_id,
      'Comment' AS "$type" -- this helps for uniqueness and resolving the type
    FROM comments
  )`,
  uniqueKey: [ 'id', '$type' ],
  typeHint: '$type',
  fields: () => ({
    id: {
      type: GraphQLInt
    },
    body: {
      type: GraphQLString
    },
    authorId: {
      type: GraphQLInt,
      sqlColumn: 'author_id'
    }
  }),
  resolveType: (obj: any) => obj.$type
} as any)

