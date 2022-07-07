import {
	InviteErrorCode,
	InviteMethod,
	InviteResponse,
	MutationInviteArgs,
	MutationResolvers,
	MutationUnmanagedInviteArgs,
} from '../../../schema'
import { TenantResolverContext } from '../../TenantResolverContext'
import {
	DatabaseContext,
	InviteData,
	InviteManager,
	isTokenHash,
	MembershipValidator,
	PermissionActions,
	ProjectManager,
} from '../../../model'
import { createMembershipValidationErrorResult } from '../../membershipUtils'
import { createErrorResponse, createProjectNotFoundResponse } from '../../errorUtils'
import { UserInputError } from '@contember/graphql-utils'
import { PersonResponseFactory } from '../../responseHelpers/PersonResponseFactory'

export class InviteMutationResolver implements MutationResolvers {
	constructor(
		private readonly inviteManager: InviteManager,
		private readonly projectManager: ProjectManager,
		private readonly membershipValidator: MembershipValidator,
	) {}

	async invite(
		parent: any,
		{ projectSlug, email, name, memberships, options }: MutationInviteArgs,
		context: TenantResolverContext,
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
		return this.doInvite(context.db, {
			email,
			project,
			memberships,
			name: name ?? undefined,
			emailVariant: options?.mailVariant || '',
			method: options?.method ?? InviteMethod.CreatePassword,
		})
	}

	async unmanagedInvite(
		parent: any,
		{ projectSlug, email, memberships, password, options }: MutationUnmanagedInviteArgs,
		context: TenantResolverContext,
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
		if (typeof options?.resetTokenHash === 'string' && !isTokenHash(options?.resetTokenHash)) {
			throw new UserInputError('Invalid format of resetTokenHash. Must be hex-encoded sha256.')
		}
		return this.doInvite(context.db, {
			email,
			project,
			memberships,
			noEmail: true,
			password: password ?? options?.password ?? undefined,
			passwordResetTokenHash: options?.resetTokenHash ?? undefined,
		})
	}

	private async doInvite(
		dbContext: DatabaseContext,
		invite: InviteData,
	): Promise<InviteResponse> {
		const validationResult = await this.membershipValidator.validate(invite.project.slug, invite.memberships)
		if (validationResult.length > 0) {
			const errors = createMembershipValidationErrorResult<InviteErrorCode>(validationResult)
			return {
				ok: false,
				errors: errors,
				error: errors[0],
			}
		}
		const response = await this.inviteManager.invite(dbContext, invite)

		if (!response.ok) {
			return createErrorResponse(response.error, response.errorMessage)
		}
		const result = response.result

		return {
			ok: true,
			errors: [],
			result: {
				person: PersonResponseFactory.createPersonResponse(result.person),
				isNew: result.isNew,
			},
		}
	}
}
