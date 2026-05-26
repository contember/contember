import {
	MutationRequestEmailVerificationArgs,
	MutationResolvers,
	MutationVerifyEmailArgs,
	RequestEmailVerificationResponse,
	VerifyEmailResponse,
} from '../../../schema'
import { GraphQLResolveInfo } from 'graphql'
import { TenantResolverContext } from '../../TenantResolverContext'
import { EmailVerificationManager, PermissionActions, PermissionContextFactory, PersonQuery } from '../../../model'
import { createErrorResponse } from '../../errorUtils'
import { ResponseOk } from '../../../model/utils/Response'

export class EmailVerificationMutationResolver implements Pick<MutationResolvers, 'requestEmailVerification' | 'verifyEmail'> {
	constructor(
		private readonly emailVerificationManager: EmailVerificationManager,
		private readonly permissionContextFactory: PermissionContextFactory,
	) {}

	async requestEmailVerification(
		parent: unknown,
		args: MutationRequestEmailVerificationArgs,
		context: TenantResolverContext,
		info: GraphQLResolveInfo,
	): Promise<RequestEmailVerificationResponse> {
		await context.requireAccess({
			action: PermissionActions.PERSON_RESET_PASSWORD,
			message: 'You are not allowed to request e-mail verification',
		})

		const person = await context.db.queryHandler.fetch(PersonQuery.byEmail(args.email))
		// Always report ok regardless of whether the address exists or is
		// already verified — same anti-enumeration stance as password reset.
		if (person?.email && person.email_verified_at === null) {
			const permissionContext = await this.permissionContextFactory.create(context.db, {
				id: person.identity_id,
				roles: person.roles,
			})
			const sent = await this.emailVerificationManager.sendVerificationEmail(context.db, permissionContext, person, {
				mailVariant: args.options?.mailVariant || undefined,
				project: args.options?.mailProject || undefined,
			})
			if (sent) {
				await context.logAuthAction({
					type: 'email_verify_init',
					response: new ResponseOk(null),
					personId: person.id,
					personInput: args.email,
				})
			}
		}
		return { ok: true }
	}

	async verifyEmail(
		parent: unknown,
		args: MutationVerifyEmailArgs,
		context: TenantResolverContext,
		info: GraphQLResolveInfo,
	): Promise<VerifyEmailResponse> {
		await context.requireAccess({
			action: PermissionActions.PERSON_RESET_PASSWORD,
			message: 'You are not allowed to verify an e-mail address',
		})

		const result = await this.emailVerificationManager.verifyEmail(context.db, args.token)
		await context.logAuthAction({
			type: 'email_verify_complete',
			response: result,
		})
		if (!result.ok) {
			return createErrorResponse(result.error, result.errorMessage)
		}
		return { ok: true }
	}
}
