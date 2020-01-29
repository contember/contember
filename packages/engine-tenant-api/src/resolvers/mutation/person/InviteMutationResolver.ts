import { InviteErrorCode, InviteResponse, MutationInviteArgs, MutationResolvers } from '../../../schema'
import { ResolverContext } from '../../ResolverContext'
import { PermissionActions, ProjectManager, ProjectScope } from '../../../model'
import { InviteManager } from '../../../model/service/InviteManager'

export class InviteMutationResolver implements MutationResolvers {
	constructor(private readonly inviteManager: InviteManager, private readonly projectManager: ProjectManager) {}

	async invite(
		parent: any,
		{ projectSlug, email, memberships }: MutationInviteArgs,
		context: ResolverContext,
	): Promise<InviteResponse> {
		const project = await this.projectManager.getProjectBySlug(projectSlug)
		await context.requireAccess({
			scope: new ProjectScope(project),
			action: PermissionActions.PERSON_INVITE,
			message: 'You are not allowed to invite a person',
		})
		if (!project) {
			return {
				ok: false,
				errors: [{ code: InviteErrorCode.ProjectNotFound }],
			}
		}

		const result = await this.inviteManager.invite(email, project.id, memberships)

		if (!result.ok) {
			return {
				ok: false,
				errors: result.errors.map(errorCode => ({ code: errorCode })),
			}
		}

		const person = {
			id: result.person.id,
			email: result.person.email,
			identity: {
				id: result.person.identity_id,
				projects: [],
			},
		}
		return {
			ok: true,
			errors: [],
			result: result.generatedPassword
				? {
						__typename: 'InviteNewResult',
						generatedPassword: result.generatedPassword,
						person: person,
				  }
				: {
						__typename: 'InviteExistingResult',
						person: person,
				  },
		}
	}
}
