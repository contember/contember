import { Project, ProjectSchemaResolver } from '../type'
import { AclSchemaEvaluatorFactory } from './AclSchemaEvaluatorFactory'
import { AuthorizationScope } from '@contember/authorization'
import { ProjectScope } from './ProjectScope'
import { Identity } from './Identity'

export class ProjectScopeFactory {
	constructor(
		private readonly schemaResolver: ProjectSchemaResolver,
		private readonly aclSchemaEvaluatorFactory: AclSchemaEvaluatorFactory,
	) {}

	async create(project: Pick<Project, 'slug'>): Promise<AuthorizationScope<Identity>> {
		const schema = await this.schemaResolver(project.slug)
		if (!schema) {
			throw new Error(`undefined project ${project.slug}`)
		}
		return new ProjectScope(project, schema.acl, this.aclSchemaEvaluatorFactory)
	}
}
