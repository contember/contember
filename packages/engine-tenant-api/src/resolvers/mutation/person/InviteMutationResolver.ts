import {
	InviteErrorCode,
	InviteResponse,
	MembershipInput,
	MutationInviteArgs,
	MutationResolvers,
	MutationUnmanagedInviteArgs,
} from '../../../schema'
import { ResolverContext } from '../../ResolverContext'
import { PermissionActions, ProjectManager, Project, InviteOptions } from '../../../model'
import { InviteManager } from '../../../model/service'
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
		return this.doInvite(project, memberships, email)
	}

	async unmanagedInvite(
		parent: any,
		{ projectSlug, email, memberships, password }: MutationUnmanagedInviteArgs,
		context: ResolverContext,
	): Promise<InviteResponse> {
		const project = await this.projectManager.getProjectBySlug(projectSlug)
		await context.requireAccess({
			scope: await context.permissionContext.createProjectScope(project),
			action: PermissionActions.PERSON_INVITE_UNMANAGED(memberships),
			message: 'You are not allowed to unmanaged person invite',
		})
		return this.doInvite(project, memberships, email, {
			noEmail: true,
			password,
		})
	}

	private async doInvite(
		project: Project | null,
		memberships: ReadonlyArray<MembershipInput>,
		email: string,
		inviteOptions: InviteOptions = {},
	): Promise<InviteResponse> {
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
		const result = await this.inviteManager.invite(email, project, memberships, inviteOptions)

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
