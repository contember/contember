import { Project, ProjectSchemaResolver } from '../type/index.js'
import { AclSchemaAccessNodeFactory } from './AclSchemaAccessNodeFactory.js'
import { AuthorizationScope } from '@contember/authorization'
import { ProjectScope } from './ProjectScope.js'
import { Identity } from './Identity.js'

export class ProjectScopeFactory {
	constructor(
		private readonly schemaAccessNodeFactory: AclSchemaAccessNodeFactory,
	) {}

	async create(schemaResolver: ProjectSchemaResolver, project: Pick<Project, 'slug'>): Promise<AuthorizationScope<Identity> | null> {
		const schema = await schemaResolver.getSchema(project.slug)
		if (!schema) {
			return null
		}
		return new ProjectScope(project, schema.acl, this.schemaAccessNodeFactory)
	}
}
