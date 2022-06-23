import { Project, ProjectSchemaResolver } from '../type/index.js'
import { AclSchemaEvaluatorFactory } from './AclSchemaEvaluatorFactory.js'
import { AuthorizationScope } from '@contember/authorization'
import { ProjectScope } from './ProjectScope.js'
import { Identity } from './Identity.js'

export class ProjectScopeFactory {
	constructor(
		private readonly aclSchemaEvaluatorFactory: AclSchemaEvaluatorFactory,
	) {}

	async create(schemaResolver: ProjectSchemaResolver, project: Pick<Project, 'slug'>): Promise<AuthorizationScope<Identity> | null> {
		const schema = await schemaResolver.getSchema(project.slug)
		if (!schema) {
			return null
		}
		return new ProjectScope(project, schema.acl, this.aclSchemaEvaluatorFactory)
	}
}
