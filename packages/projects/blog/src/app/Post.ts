import {
  GraphQLObjectType,
  GraphQLList,
  GraphQLString,
  GraphQLInt,
  GraphQLBoolean
} from 'graphql'

import User from './User'
import Comment from './Comment'
import Authored from './Authored'

export default new GraphQLObjectType({
  description: 'A post from a user',
  name: 'Post',
  // another table in SQL to map to
  sqlTable: 'posts',
  uniqueKey: 'id',
  interfaces: () => [ Authored ],
  fields: () => ({
    id: {
      // SQL column assumed to be "id"
      type: GraphQLInt
    },
    body: {
      description: 'The content of the post',
      // assumed to be "body"
      type: GraphQLString
    },
    author: {
      description: 'The user that created the post',
      // a back reference to its User
      type: User,
      // this is a one-to-one
      sqlJoin: (postTable: string, userTable: string) => `${postTable}.author_id = ${userTable}.id`
    },
    authorId: {
      type: GraphQLInt,
      sqlColumn: 'author_id'
    },
    comments: {
      description: 'The comments on this post',
      type: new GraphQLList(Comment),
      // instead of doing yet another JOIN, we'll get these comments in a separate batch
      // sqlJoin: (postTable, commentTable) => `${postTable}.id = ${commentTable}.post_id AND ${commentTable}.archived = (0 = 1)`,
      sqlBatch: {
        // which column to match up to the users
        thisKey: 'post_id',
        // the other column to compare to
        parentKey: 'id'
      },
      // only get the comments where archived is `false`. sqlite3 has no FALSE keyword. `0 = 1` is a workaround to be compatible
      where: (table: string) => `${table}.archived = (0 = 1)`
    },
    numComments: {
      description: 'The number of comments on this post',
      type: GraphQLInt,
      // use a correlated subquery in a raw SQL expression to do things like aggregation
      sqlExpr: (table: string) => `(SELECT count(*) FROM comments WHERE post_id = ${table}.id AND archived = (0 = 1))`
    },
    archived: {
      type: GraphQLBoolean
    },
    createdAt: {
      type: GraphQLString,
      sqlColumn: 'created_at'
    }
  })
} as any)
