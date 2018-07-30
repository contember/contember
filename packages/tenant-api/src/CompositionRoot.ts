import * as knex from 'knex'
import {ApolloServer} from 'apollo-server'
import typeDefs from './schema/tenant.graphql'
import SignInMutationResolver from './resolvers/mutation/SignInMutationResolver'
import KnexConnection from './core/knex/KnexConnection'
import Env from './Env'
import QueryHandler from './core/query/QueryHandler'
import KnexQueryable from './core/knex/KnexQueryable'
import SignInManager from './model/service/SignInManager'
import SignUpManager from './model/service/SignUpManager'
import SignUpMutationResolver from './resolvers/mutation/SignUpMutationResolver'
import MeQueryResolver from './resolvers/query/MeQueryResolver'
import ProjectMemberManager from './model/service/ProjectMemberManager'
import ApiKeyManager from './model/service/ApiKeyManager'
import Container from './core/dic/Container'

export default class CompositionRoot {
  composeServer(env: Env): ApolloServer {
    const container = new Container.Builder({})
      .addService('env', () => env)

      .addService('knexConnection', ({env}) => {
        return new KnexConnection(knex({
          debug: true,
          client: 'pg',
          connection: {
            host: env.DB_HOST,
            port: env.DB_PORT,
            user: env.DB_USER,
            password: env.DB_PASSWORD,
            database: env.DB_DATABASE,
          }
        }))
      })
      .addService('queryHandler', ({knexConnection}) => {
        const handler = new QueryHandler(new KnexQueryable(knexConnection, {
          get(): QueryHandler<KnexQueryable> {
            return handler
          }
        }))

        return handler
      })

      .addService('apiKeyManager', ({queryHandler, knexConnection}) => new ApiKeyManager(queryHandler, knexConnection))
      .addService('signUpManager', ({queryHandler, knexConnection}) => new SignUpManager(queryHandler, knexConnection))
      .addService('signInManager', ({queryHandler, apiKeyManager}) => new SignInManager(queryHandler, apiKeyManager))
      .addService('projectMemberManager', ({queryHandler, knexConnection}) => new ProjectMemberManager(queryHandler, knexConnection))

      .addService('meQueryResolver', ({queryHandler}) => new MeQueryResolver(queryHandler))
      .addService('signUpMutationResolver', ({signUpManager, queryHandler}) => new SignUpMutationResolver(signUpManager, queryHandler))
      .addService('signInMutationResolver', ({signInManager, queryHandler}) => new SignInMutationResolver(signInManager, queryHandler))
      .addService('addProjectMemberMutationResolver', ({queryHandler, knexConnection}) => new ProjectMemberManager(queryHandler, knexConnection))

      .addService('resolvers', ({meQueryResolver, signUpMutationResolver, signInMutationResolver, addProjectMemberMutationResolver}) => {
        return {
          Query: {
            me: meQueryResolver.me.bind(meQueryResolver),
          },
          Mutation: {
            signUp: signUpMutationResolver.signUp.bind(signUpMutationResolver),
              signIn: signInMutationResolver.signIn.bind(signInMutationResolver),
              addProjectMember: addProjectMemberMutationResolver.addProjectMember.bind(addProjectMemberMutationResolver)
          },
        }
      })

      .addService('server', ({resolvers}) => new ApolloServer({typeDefs, resolvers}))
      .build()

    return container.get('server')
  }
}
