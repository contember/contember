import { InviteErrorCode, InviteResponse, MutationInviteArgs, MutationResolvers, MutationUnmanagedInviteArgs } from '../../../schema'
import { TenantResolverContext } from '../../TenantResolverContext'
import { InviteData, InviteManager, isTokenHash, MembershipValidator, PermissionActions, ProjectManager } from '../../../model'
import { createMembershipValidationErrorResult } from '../../membershipUtils'
import { createErrorResponse, createProjectNotFoundResponse } from '../../errorUtils'
import { UserInputError } from '@contember/graphql-utils'
import { PersonResponseFactory } from '../../responseHelpers/PersonResponseFactory'
import { ResponseOk } from '../../../model/utils/Response'
import { Acl, JSONValue } from '@contember/schema'

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
			return createProjectNotFoundResponse('PROJECT_NOT_FOUND', projectSlug)
		}
		return this.doInvite(context, {
			email,
			project,
			memberships,
			name: name ?? undefined,
			emailVariant: options?.mailVariant || '',
			method: options?.method ?? 'CREATE_PASSWORD',
		}, { unmanaged: false })
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
			return createProjectNotFoundResponse('PROJECT_NOT_FOUND', projectSlug)
		}
		if (typeof options?.resetTokenHash === 'string' && !isTokenHash(options?.resetTokenHash)) {
			throw new UserInputError('Invalid format of resetTokenHash. Must be hex-encoded sha256.')
		}
		return this.doInvite(context, {
			email,
			project,
			memberships,
			noEmail: true,
			password: password ?? options?.password ?? undefined,
			passwordResetTokenHash: options?.resetTokenHash ?? undefined,
		}, { unmanaged: true })
	}

	private async doInvite(
		context: TenantResolverContext,
		invite: InviteData,
		audit: { unmanaged: boolean },
	): Promise<InviteResponse> {
		const validationResult = await this.membershipValidator.validate(invite.project.slug, invite.memberships)
		if (validationResult.length > 0) {
			const errors = createMembershipValidationErrorResult(validationResult)
			return {
				ok: false,
				errors: errors,
				error: errors[0],
			}
		}
		const response = await this.inviteManager.invite(context.db, invite)

		if (!response.ok) {
			return createErrorResponse(response.error, response.errorMessage)
		}
		const result = response.result

		await context.logAuthAction({
			type: 'person_invite',
			response: new ResponseOk(null),
			targetPersonId: result.person.id,
			personInput: invite.email,
			eventData: {
				projectSlug: invite.project.slug,
				isNew: result.isNew,
				unmanaged: audit.unmanaged,
				memberships: invite.memberships.map(membershipToJson),
			},
		})

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

const membershipToJson = ({ role, variables }: Acl.Membership): JSONValue => ({
	role,
	variables: variables.map(({ name, values }) => ({ name, values: [...values] })),
})
