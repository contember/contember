import {
	InviteErrorCode,
	InviteMethod,
	InviteResponse,
	MembershipInput,
	MutationInviteArgs,
	MutationResolvers,
	MutationUnmanagedInviteArgs,
} from '../../../schema/index.js'
import { TenantResolverContext } from '../../TenantResolverContext.js'
import {
	DatabaseContext,
	InviteManager,
	InviteOptions,
	isTokenHash,
	MembershipValidator,
	PermissionActions,
	Project,
	ProjectManager,
} from '../../../model/index.js'
import { createMembershipValidationErrorResult } from '../../membershipUtils.js'
import { createErrorResponse, createProjectNotFoundResponse } from '../../errorUtils.js'
import { UserInputError } from '@contember/graphql-utils'

export class InviteMutationResolver implements MutationResolvers {
	constructor(
		private readonly inviteManager: InviteManager,
		private readonly projectManager: ProjectManager,
		private readonly membershipValidator: MembershipValidator,
	) {}

	async invite(
		parent: any,
		{ projectSlug, email, memberships, options }: MutationInviteArgs,
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
		return this.doInvite(context.db, project, memberships, email, {
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
		return this.doInvite(context.db, project, memberships, email, {
			noEmail: true,
			password: password ?? options?.password ?? undefined,
			passwordResetTokenHash: options?.resetTokenHash ?? undefined,
		})
	}

	private async doInvite(
		dbContext: DatabaseContext,
		project: Project,
		memberships: ReadonlyArray<MembershipInput>,
		email: string,
		inviteOptions: InviteOptions = {},
	): Promise<InviteResponse> {
		const validationResult = await this.membershipValidator.validate(project.slug, memberships)
		if (validationResult.length > 0) {
			const errors = createMembershipValidationErrorResult<InviteErrorCode>(validationResult)
			return {
				ok: false,
				errors: errors,
				error: errors[0],
			}
		}
		const response = await this.inviteManager.invite(dbContext, email, project, memberships, inviteOptions)

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
