import KnexQuery from '../../../core/knex/KnexQuery'
import KnexQueryable from '../../../core/knex/KnexQueryable'

class ProjectByIdQuery extends KnexQuery<ProjectByIdQuery.Result> {
  constructor(private readonly projectId: string) {
    super();
  }

  async fetch(queryable: KnexQueryable): Promise<ProjectByIdQuery.Result> {
    const rows = await queryable.createQueryBuilder()
      .select('id', 'name')
      .from('tenant.project')
      .where('id', this.projectId)

    return this.fetchOneOrNull(rows)
  }
}

namespace ProjectByIdQuery {
  export type Result = null|{
    readonly id: string
    readonly name: string
  }
}

export default ProjectByIdQuery
