import { Project } from '../../type/index.js'
import { NON_DELEGABLE_TENANT_ROLES, PermissionContext } from '../../authorization/index.js'
import { PersonRow } from '../../queries/index.js'
import { DatabaseContext } from '../../utils/index.js'
import { ProjectManager } from '../ProjectManager.js'

/**
 * Resolves the project whose mail template and name/slug variables a mail to `person` uses.
 * A holder of a non-delegable role gets no project: whoever may edit a project's templates
 * could otherwise plant one that leaks that person's token or code.
 */
export const getMailProject = async ({ projectManager, dbContext, permissionContext, person, preferredProjectSlug }: {
	projectManager: ProjectManager
	dbContext: DatabaseContext
	permissionContext: PermissionContext
	person: Pick<PersonRow, 'identity_id' | 'roles'>
	preferredProjectSlug: string | null
}): Promise<Project | null> => {
	if (person.roles.some(role => NON_DELEGABLE_TENANT_ROLES.has(role))) {
		return null
	}
	const projects = await projectManager.getProjectsByIdentity(dbContext, person.identity_id, permissionContext)
	if (projects.length === 1) {
		return projects[0]
	}
	if (preferredProjectSlug) {
		return projects.find(it => it.slug === preferredProjectSlug) || null
	}
	return null
}
