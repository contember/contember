import {RequestHandler} from 'express'
import {ApolloServer} from 'apollo-server-express'
import * as express from 'express'

export default class TenantMiddlewareFactory {
  constructor(
    private apolloServer: ApolloServer,
  ) {}

  create(): RequestHandler {
    const tenantExpress = express()
    this.apolloServer.applyMiddleware({ app: tenantExpress, path: '/tenant' })

    return tenantExpress
  }
}
