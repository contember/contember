import {
	InviteErrorCode,
	InviteResponse,
	MembershipInput,
	MutationInviteArgs,
	MutationResolvers,
	MutationUnmanagedInviteArgs,
} from '../../../schema'
import { ResolverContext } from '../../ResolverContext'
import {
	DatabaseContext,
	InviteManager,
	InviteOptions,
	MembershipValidator,
	PermissionActions,
	Project,
	ProjectManager,
} from '../../../model'
import { createMembershipValidationErrorResult } from '../../membershipUtils'
import { createErrorResponse, createProjectNotFoundResponse } from '../../errorUtils'

export class InviteMutationResolver implements MutationResolvers {
	constructor(
		private readonly inviteManager: InviteManager,
		private readonly projectManager: ProjectManager,
		private readonly membershipValidator: MembershipValidator,
	) {}

	async invite(
		parent: any,
		{ projectSlug, email, memberships, options }: MutationInviteArgs,
		context: ResolverContext,
	): Promise<InviteResponse> {
		const project = await this.projectManager.getProjectBySlug(context.db, projectSlug)
		await context.requireAccess({
			scope: await context.permissionContext.createProjectScope(project),
			action: PermissionActions.PERSON_INVITE(memberships),
			message: 'You are not allowed to invite a person',
		})
		if (!project) {
			return createProjectNotFoundResponse(InviteErrorCode.ProjectNotFound, projectSlug)
		}
		return this.doInvite(context.db, project, memberships, email, {
			emailVariant: options?.mailVariant || '',
		})
	}

	async unmanagedInvite(
		parent: any,
		{ projectSlug, email, memberships, password }: MutationUnmanagedInviteArgs,
		context: ResolverContext,
	): Promise<InviteResponse> {
		const project = await this.projectManager.getProjectBySlug(context.db, projectSlug)
		await context.requireAccess({
			scope: await context.permissionContext.createProjectScope(project),
			action: PermissionActions.PERSON_INVITE_UNMANAGED(memberships),
			message: 'You are not allowed to unmanaged person invite',
		})
		if (!project) {
			return createProjectNotFoundResponse(InviteErrorCode.ProjectNotFound, projectSlug)
		}
		return this.doInvite(context.db, project, memberships, email, {
			noEmail: true,
			password,
		})
	}

	private async doInvite(
		db: DatabaseContext,
		project: Project,
		memberships: ReadonlyArray<MembershipInput>,
		email: string,
		inviteOptions: InviteOptions = {},
	): Promise<InviteResponse> {
		const validationResult = await this.membershipValidator.validate(db, project.slug, memberships)
		if (validationResult.length > 0) {
			const errors = createMembershipValidationErrorResult<InviteErrorCode>(validationResult)
			return {
				ok: false,
				errors: errors,
				error: errors[0],
			}
		}
		const response = await this.inviteManager.invite(db, email, project, memberships, inviteOptions)

		if (!response.ok) {
			return createErrorResponse(response.error, response.errorMessage)
		}
		const result = response.result

		const person = {
			id: result.person.id,
			email: result.person.email,
			otpEnabled: !!result.person.otp_activated_at,
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
