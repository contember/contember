import { Project as ProjectDto } from '../../model/index.js'
import { Project } from '../../schema/index.js'

/** Placeholder for `Project.permissions`; `ProjectTypeResolver.permissions` always replaces it. */
const unresolvedPermissions = {
	canViewMembers: false,
	canAddMember: false,
	canUpdateMember: false,
	canRemoveMember: false,
	canViewSecrets: false,
	canSetSecret: false,
	canCreateApiKey: false,
	canUpdate: false,
}

export class ProjectResponseFactory {
	/**
	 * The row plus placeholders for everything `ProjectTypeResolver` resolves per caller — members,
	 * roles, api keys, secrets and permissions all need the project scope, which is not known here.
	 */
	public static createProjectResponse(project: ProjectDto): Project {
		return { ...project, members: [], roles: [], apiKeys: [], secrets: [], permissions: unresolvedPermissions }
	}
}
