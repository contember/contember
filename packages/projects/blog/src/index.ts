import { GraphQLServer } from 'graphql-yoga'
import QueryRoot from './app'


const server = new GraphQLServer({
  schema: QueryRoot,
})
server.start(() => console.log('Server is running on localhost:4000'))
