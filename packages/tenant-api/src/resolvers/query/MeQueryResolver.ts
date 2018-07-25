import {Person, QueryResolvers} from '../../../generated/types'
import {GraphQLResolveInfo} from 'graphql'
import ResolverContext from '../ResolverContext'
import QueryHandler from '../../core/query/QueryHandler'
import KnexQueryable from '../../core/knex/KnexQueryable'
import PersonByIdQuery from '../../model/queries/PersonByIdQuery'
import ImplementationException from '../../core/exceptions/ImplementationException'
import ProjectsByPersonQuery from '../../model/queries/ProjectsByPersonQuery'

export default class MeQueryResolver implements QueryResolvers.Resolvers {
  constructor(
    private readonly queryHandler: QueryHandler<KnexQueryable>,
  ) {}

  async me(parent: any, args: any, context: ResolverContext, info: GraphQLResolveInfo): Promise<Person> {
    const personId = context.personId // TODO: may NOT exist
    const [personRow, projectRows] = await Promise.all([
      this.queryHandler.fetch(new PersonByIdQuery(personId)),
      this.queryHandler.fetch(new ProjectsByPersonQuery(personId)),
    ])

    if (personRow === null) {
      throw new ImplementationException()
    }

    return {
      id: personRow.id,
      email: personRow.email,
      projects: projectRows,
    }
  }
}
