import { InviteErrorCode, InviteResponse, MutationInviteArgs, MutationResolvers } from '../../../schema'
import { ResolverContext } from '../../ResolverContext'
import { PermissionActions, ProjectManager, ProjectScope } from '../../../model'
import { InviteManager } from '../../../model/service/InviteManager'
import { createMembershipValidationErrorResult } from '../../utils'
import { MembershipValidator } from '../../../model/service/MembershipValidator'

export class InviteMutationResolver implements MutationResolvers {
	constructor(
		private readonly inviteManager: InviteManager,
		private readonly projectManager: ProjectManager,
		private readonly membershipValidator: MembershipValidator,
	) {}

	async invite(
		parent: any,
		{ projectSlug, email, memberships }: MutationInviteArgs,
		context: ResolverContext,
	): Promise<InviteResponse> {
		const project = await this.projectManager.getProjectBySlug(projectSlug)
		await context.requireAccess({
			scope: await context.permissionContext.createProjectScope(project),
			action: PermissionActions.PERSON_INVITE(memberships),
			message: 'You are not allowed to invite a person',
		})
		if (!project) {
			return {
				ok: false,
				errors: [{ code: InviteErrorCode.ProjectNotFound }],
			}
		}
		const validationResult = await this.membershipValidator.validate(project.slug, memberships)
		if (validationResult.length > 0) {
			return {
				ok: false,
				errors: createMembershipValidationErrorResult(validationResult),
			}
		}
		const result = await this.inviteManager.invite(email, project, memberships)

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
			result: {
				person,
				isNew: result.isNew,
			},
		}
	}
}
