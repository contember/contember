import {MutationResolvers, SignUpResponse} from '../../../generated/types'
import {GraphQLResolveInfo} from 'graphql'
import ResolverContext from '../ResolverContext'
import SignUpManager from '../../model/service/SignUpManager'
import QueryHandler from '../../core/db/QueryHandler'
import KnexQueryable from '../../core/db/KnexQueryable'
import PersonByIdQuery from '../../model/queries/PersonByIdQuery'
import ImplementationException from '../../core/exceptions/ImplementationException'
import ProjectsByPersonQuery from '../../model/queries/ProjectsByPersonQuery'

export default class SignUpMutationResolver implements MutationResolvers.Resolvers {
  constructor(
    private readonly signUpManager: SignUpManager,
    private readonly queryHandler: QueryHandler<KnexQueryable>,
  ) {}

  async signUp(parent: any, args: MutationResolvers.SignUpArgs, context: ResolverContext, info: GraphQLResolveInfo): Promise<SignUpResponse> {
    const result = await this.signUpManager.signUp(args.email, args.password)

    if (!result.ok) {
      return {
        ok: false,
        errors: result.errors.map(errorCode => ({ code: errorCode })),
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
        person: {
          id: personRow.id,
          email: personRow.email,
          projects: projectRows
        }
      }
    }
  }
}
