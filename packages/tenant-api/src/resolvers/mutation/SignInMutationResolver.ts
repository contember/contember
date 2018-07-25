import {MutationResolvers, SignInResponse} from '../../../generated/types'
import {GraphQLResolveInfo} from 'graphql'
import ResolverContext from '../ResolverContext'
import SignInManager from '../../model/service/SignInManager'
import ImplementationException from '../../core/exceptions/ImplementationException'
import QueryHandler from '../../core/query/QueryHandler'
import KnexQueryable from '../../core/knex/KnexQueryable'
import PersonByIdQuery from '../../model/queries/PersonByIdQuery'
import ProjectsByPersonQuery from '../../model/queries/ProjectsByPersonQuery'

export default class SignInMutationResolver implements MutationResolvers.Resolvers {
  constructor(
    private readonly signInManager: SignInManager,
    private readonly queryHandler: QueryHandler<KnexQueryable>,
  ) {}

  async signIn(parent: any, args: MutationResolvers.SignInArgs, context: ResolverContext, info: GraphQLResolveInfo): Promise<SignInResponse> {
    const result = await this.signInManager.signIn(args.email, args.password)

    if (!result.ok) {
      return {
        ok: false,
        errors: result.errors.map(errorCode => ({code: errorCode})),
      }
    }

    const [personRow, projectRows] = await Promise.all([
      this.queryHandler.fetch(new PersonByIdQuery(result.personId)),
      this.queryHandler.fetch(new ProjectsByPersonQuery(result.personId)),
    ])

    if (personRow === null) {
      throw new ImplementationException()
    }

    return {
      ok: true,
      errors: [],
      result: {
        token: result.token,
        person: {
          id: personRow.id,
          email: personRow.email,
          projects: projectRows,
        },
      },
    }
  }
}
