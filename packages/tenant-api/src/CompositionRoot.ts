import * as knex from 'knex'
import {ApolloServer} from 'apollo-server'
import {DocumentNode} from 'graphql'
import typeDefs from './schema/tenant.graphql'
import Resolver from './resolvers/Resolver'
import SignInMutationResolver from './resolvers/mutation/SignInMutationResolver'
import KnexConnection from './core/knex/KnexConnection'
import Env from './Env'
import QueryHandler from './core/query/QueryHandler'
import KnexQueryable from './core/knex/KnexQueryable'
import QueryHandlerAccessor from './core/query/QueryHandlerAccessor'
import SignInManager from './model/service/SignInManager'
import SignUpManager from './model/service/SignUpManager'
import SignUpMutationResolver from './resolvers/mutation/SignUpMutationResolver'
import MeQueryResolver from './resolvers/query/MeQueryResolver'
import ProjectMemberManager from './model/service/ProjectMemberManager'
import AddProjectMemberMutationResolver from './resolvers/mutation/AddProjectMemberMutationResolver'
import ApiKeyManager from './model/service/ApiKeyManager'

export default class CompositionRoot {
  composeServer(env: Env): ApolloServer {
    const db = this.createDatabaseConnection(env)
    const queryHandler = this.createQueryHandler(db)

    const apiKeyManager = this.createApiKeyManager(queryHandler, db)
    const signUpManager = this.createSignUpManager(queryHandler, db)
    const signInManager = this.createSignInManager(queryHandler, apiKeyManager)
    const projectMemberManager = this.createProjectMemberManager(queryHandler, db)

    const meQueryResolver = this.createMeQueryResolver(queryHandler)
    const signUpMutationResolver = this.createSignUpMutationResolver(signUpManager, queryHandler)
    const signInMutationResolver = this.createSignInMutationResolver(signInManager, queryHandler)
    const addProjectMemberMutationResolver = this.createAddProjectMemberMutationResolver(projectMemberManager)

    const resolver = this.createResolver(
      meQueryResolver,
      signUpMutationResolver,
      signInMutationResolver,
      addProjectMemberMutationResolver,
    )

    return this.createServer([typeDefs], resolver)
  }

  private createServer(typeDefs: Array<DocumentNode>, resolvers: Resolver): ApolloServer {
    return new ApolloServer({
      typeDefs,
      resolvers,
    })
  }

  private createResolver(meQuery: MeQueryResolver, signUp: SignUpMutationResolver, signIn: SignInMutationResolver, addProjectMember: AddProjectMemberMutationResolver): Resolver {
    return {
      Query: {
        me: meQuery.me.bind(meQuery),
      },
      Mutation: {
        signUp: signUp.signUp.bind(signUp),
        signIn: signIn.signIn.bind(signIn),
        addProjectMember: addProjectMember.addProjectMember.bind(addProjectMember)
      },
    }
  }

  private createAddProjectMemberMutationResolver(projectMemberManager: ProjectMemberManager): AddProjectMemberMutationResolver {
    return new AddProjectMemberMutationResolver(projectMemberManager)
  }

  private createSignInMutationResolver(signInManager: SignInManager, queryHandler: QueryHandler<KnexQueryable>): SignInMutationResolver {
    return new SignInMutationResolver(signInManager, queryHandler);
  }

  private createSignUpMutationResolver(signUpManager: SignUpManager, queryHandler: QueryHandler<KnexQueryable>): SignUpMutationResolver {
    return new SignUpMutationResolver(signUpManager, queryHandler)
  }

  private createMeQueryResolver(queryHandler: QueryHandler<KnexQueryable>): MeQueryResolver {
    return new MeQueryResolver(queryHandler)
  }

  private createProjectMemberManager(queryHandler: QueryHandler<KnexQueryable>, db: KnexConnection): ProjectMemberManager {
    return new ProjectMemberManager(queryHandler, db)
  }

  private createSignInManager(queryHandler: QueryHandler<KnexQueryable>, apiKeyManager: ApiKeyManager): SignInManager {
    return new SignInManager(queryHandler, apiKeyManager)
  }

  private createSignUpManager(queryHandler: QueryHandler<KnexQueryable>, db: KnexConnection): SignUpManager {
    return new SignUpManager(queryHandler, db)
  }

  private createApiKeyManager(queryHandler: QueryHandler<KnexQueryable>, db: KnexConnection): ApiKeyManager {
    return new ApiKeyManager(queryHandler, db)
  }

  private createQueryHandler(db: KnexConnection): QueryHandler<KnexQueryable> {
    const accessor = new class implements QueryHandlerAccessor<KnexQueryable> {
      get(): QueryHandler<KnexQueryable> {
        return handler
      }
    };

    const queryable = new KnexQueryable(db, accessor)
    const handler = new QueryHandler<KnexQueryable>(queryable)

    return handler
  }

  private createDatabaseConnection(env: Env): KnexConnection {
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
  }
}
