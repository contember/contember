import KnexQuery from '../../core/db/KnexQuery'
import KnexQueryable from '../../core/db/KnexQueryable'

class ProjectsByPersonQuery extends KnexQuery<ProjectsByPersonQuery.Result> {
  constructor(private readonly personId: string) {
    super();
  }

  async fetch(queryable: KnexQueryable): Promise<ProjectsByPersonQuery.Result> {
    return await queryable.createQueryBuilder()
      .select('tenant.project.id', 'tenant.project.name')
      .from('tenant.project')
      .innerJoin('tenant.project_member', 'tenant.project_member.project_id', 'tenant.project.id')
      .where('tenant.project_member.person_id', this.personId)
  }
}

namespace ProjectsByPersonQuery {
  export type Result = Array<{
    readonly id: string
    readonly name: string
  }>
}

export default ProjectsByPersonQuery
