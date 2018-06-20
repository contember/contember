import {
  GraphQLObjectType,
  GraphQLList,
  GraphQLString,
  GraphQLInt,
  GraphQLFloat, GraphQLNonNull, GraphQLBoolean
} from 'graphql'

import knex from './database'
import Comment from './Comment'
import Post from './Post'
import Authored from './Authored'

const User = new GraphQLObjectType({
  description: 'a stem contract account',
  name: 'User',
  // tell join monster the expression for the table
  sqlTable: 'accounts',
  // one of the columns must be unique for deduplication purposes
  uniqueKey: 'id',
  fields: () => ({
    id: {
      // no `sqlColumn` and no `resolve`. assumed that the column name is the same as the field name: id
      type: GraphQLInt
    },
    email: {
      type: GraphQLString,
      // specify the SQL column
      sqlColumn: 'email_address'
    },
    idEncoded: {
      description: 'The ID base-64 encoded',
      type: GraphQLString,
      sqlColumn: 'id',
      // specifies SQL column and applies a custom resolver
      resolve: (user: any) => toBase64(user.idEncoded)
    },
    fullName: {
      description: 'A user\'s first and last name',
      type: GraphQLString,
      // depends on multiple SQL columns
      sqlDeps: [ 'first_name', 'last_name' ],
      resolve: (user: any) => `${user.first_name} ${user.last_name}`
    },
    fullNameAnotherWay: {
      type: GraphQLString,
      // or you could use a raw SQL expression
      sqlExpr: (table: string) => `${table}.first_name || ' ' || ${table}.last_name`
    },
    posts: {
      description: 'A list of Posts the user has written',
      // has another GraphQLObjectType as a field
      type: new GraphQLList(Post),
      args: {
        archived: {
          description: 'Archived posts?',
          type: GraphQLBoolean
        }
      },
      // this is a one-to-many relation
      // this function tells join monster how to join these tables
      sqlJoin: (userTable: string, postTable: string, args: any) => {
        let join = `${userTable}.id = ${postTable}.author_id`

        console.log(args)

        if (args.archived !== undefined) {
          const val = args.archived ? 1 : 0
          join += " AND " + `(${postTable}.archived = ${val} OR ${postTable}.id IS NULL)`

        }
        return join
      },
      orderBy: 'id'
    },
    comments: {
      description: 'Comments the user has written on people\'s posts',
      // another one-to-many relation
      type: new GraphQLList(Comment),
      // only JOIN comments that are not archived
      sqlJoin: (userTable: string, commentTable: string) => `${userTable}.id = ${commentTable}.author_id AND ${commentTable}.archived = (0 = 1)`,
      orderBy: { id: 'DESC' }
    },
    following: {
      description: 'Users that this user is following',
      type: new GraphQLList(User),
      // many-to-many is supported too, via an intermediate join table
      junction: {
        sqlTable: 'relationships',
        sqlJoins: [
          (followerTable: string, relationTable: string) => `${followerTable}.id = ${relationTable}.follower_id`,
          (relationTable: string, followeeTable: string) => `${relationTable}.followee_id = ${followeeTable}.id`
        ]
      }
    },
    favNums: {
      type: new GraphQLList(GraphQLInt),
      // you can still have resolvers that get data from other sources. simply omit the `sqlColumn` and define a resolver
      resolve: () => [1, 2, 3]
    },
    numLegs: {
      description: 'How many legs this user has',
      type: GraphQLInt,
      sqlColumn: 'num_legs'
    },
    // object types without a `sqlTable` are a no-op. Join Monster will ignore it and let you resolve it another way!
    luckyNumber: {
      type: new GraphQLObjectType({
        name: 'LuckyNumber',
        fields: {
          value: { type: GraphQLFloat }
        }
      }),
      resolve: () => {
        return knex.raw('SELECT random() AS num').then((num: any) => ({ value: num[0].num }))
      }
    },
    writtenMaterial: {
      // use an interface type
      type: new GraphQLList(Authored),
      orderBy: 'id',
      sqlJoin: (userTable: string, unionTable: string) => `${userTable}.id = ${unionTable}.author_id`
    }
  })
} as any)

export default User

function toBase64(clear: any) {
  return Buffer.from(String(clear)).toString('base64')
}
